import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  Res,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentTransactionService } from './payment-transaction.service';
import { CreatePaymentTransactionDto } from './dto/create-payment-transaction.dto';
import { MailService } from '../mail/mail.service';
import { PaymentGatewayFactory } from './payment-gateway.factory.service';

@Controller('payorder')
export class PayOrderController {
  private readonly logger = new Logger(PayOrderController.name);

  constructor(
    private readonly paymentFactory: PaymentGatewayFactory,
    private readonly paymentTransactionService: PaymentTransactionService,
    private readonly mailService: MailService,
  ) { }

  @Post('create-payment-url')
  async payOrder(
    @Body() CreatePaymentTransactionDto: CreatePaymentTransactionDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const ipAddr = '127.0.0.1';

      const { transaction, order } =
        await this.paymentTransactionService.createTransaction(
          CreatePaymentTransactionDto,
        );

      this.logger.log(
        `Created transaction: ${transaction.payment_transaction_id} for order: ${CreatePaymentTransactionDto.order_id} with amount: ${order.subtotal}`,
      );

      const gateway = this.paymentFactory.createGateway(transaction.method);
      const paymentResponse = await gateway.processPayment(
        ipAddr,
        order,
        CreatePaymentTransactionDto,
      );

      return res.json({
        paymentUrl: paymentResponse.url,
        type: paymentResponse.type,
        // displayContent: paymentResponse.displayContent 
      });
    } catch (error) {
      this.logger.error('Error creating payment URL:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to create payment URL',
        error: error.message,
      });
    }
  }

  @Post('vietqr-callback')
  async handleVietQRCallback(@Body() body: any, @Res() res: Response) {
    try {
      this.logger.log('VietQR Callback received:', JSON.stringify(body));

      // Attempt to extract Order ID from content/description
      // Expected format in content: "PAY <Order_ID>"
      const content = body.content || body.description || body.remark || '';
      // Regex to find "PAY" followed by numbers, case insensitive
      const orderIdMatch = content.match(/PAY\s*(\d+)/i);

      if (orderIdMatch && orderIdMatch[1]) {
        const orderId = parseInt(orderIdMatch[1], 10);
        this.logger.log(`Extracted Order ID: ${orderId} from VietQR callback`);

        // Check if transaction exists and update
        // We assume SUCCESS if callback is received with correct amount (validation skipped for now)
        await this.paymentTransactionService.updateTransactionStatus(
          orderId,
          'SUCCESS',
          body,
        );

        // Send confirmation email
        try {
          const { order, deliveryInfo, transaction } =
            await this.paymentTransactionService.getOrderDetailsForEmail(
              orderId,
            );
          await this.mailService.sendOrderConfirmation(
            order,
            transaction,
            deliveryInfo,
          );
        } catch (emailError) {
          this.logger.error(
            `Failed to send email for order ${orderId}`,
            emailError,
          );
        }

        return res.json({ success: true, message: 'Transaction verified' });
      }

      this.logger.warn('Could not extract Order ID from VietQR callback content');
      return res.json({ success: false, message: 'Order ID not found in content' });

    } catch (error) {
      this.logger.error('Error handling VietQR callback:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to process callback',
        error: error.message,
      });
    }
  }

  // @Get('transactions')
  // async getAllTransactions() {
  //   try {
  //     const transactions = await this.paymentTransactionService.findAll();
  //     return {
  //       success: true,
  //       data: transactions,
  //     };
  //   } catch (error) {
  //     this.logger.error('Error fetching transactions:', error);
  //     return {
  //       success: false,
  //       message: 'Failed to fetch transactions',
  //       error: error.message,
  //     };
  //   }
  // }

  @Get('transaction/:orderId')
  async getTransaction(@Param('orderId', ParseIntPipe) orderId: number) {
    try {
      const transaction = await this.paymentTransactionService.findByOrderId(orderId);
      return {
        success: true,
        data: transaction,
      };
    } catch (error) {
      this.logger.error('Error fetching transaction:', error);
      return {
        success: false,
        message: 'Failed to fetch transaction',
        error: error.message,
      };
    }
  }
}
