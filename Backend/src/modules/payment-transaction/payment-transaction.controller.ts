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
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentTransactionService } from './payment-transaction.service';
import { CreatePaymentTransactionDto } from './dto/create-payment-transaction.dto';
import { VNPayCallbackDto } from './dto/vnpay-callback.dto';
import { MailService } from '../mail/mail.service';
import { PaymentGatewayFactory } from './payment-gateway.factory.service';

@Controller('payorder')
export class PayOrderController {
  private readonly logger = new Logger(PayOrderController.name);

  constructor(
    private readonly paymentFactory: PaymentGatewayFactory,
    // private readonly vnpayService: VNPayService,
    private readonly paymentTransactionService: PaymentTransactionService,
    private readonly mailService: MailService,
  ) {}

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
      const paymentUrl = gateway.createPaymentUrl(
        ipAddr,
        order,
        CreatePaymentTransactionDto,
      );

      return res.json({ paymentUrl });
    } catch (error) {
      this.logger.error('Error creating payment URL:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to create payment URL',
        error: error.message,
      });
    }
  }

  @Get('vnpay-return')
  async sendEmailConfirmation(
    @Query() query: VNPayCallbackDto,
    @Res() res: Response,
  ) {
    try {
      this.logger.log('VNPAY return callback received:', query);

      // Determine transaction status
      let status = 'FAILED';
      if (query.vnp_ResponseCode === '00') {
        status = 'SUCCESS';
      } else if (query.vnp_ResponseCode === '24') {
        status = 'CANCELLED';
      }

      const orderId = parseInt(query.vnp_TxnRef, 10);

      // Update transaction status
      await this.paymentTransactionService.updateTransactionStatus(
        orderId,
        status,
        query,
      );

      this.logger.log(
        `Updated transaction for order ${orderId} status to ${status}`,
      );

      // Redirect to success/failure page based on status
      if (status === 'SUCCESS') {
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
        return res.redirect(`http://localhost:8082`);
      } else {
        return res.redirect(
          `/payment-failed?orderId=${orderId}&reason=${query.vnp_ResponseCode}`,
        );
      }
    } catch (error) {
      this.logger.error('Error handling VNPay return:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to process payment return',
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

  // @Get('transaction/:orderId')
  // async getTransaction(@Param('orderId') orderId: number) {
  //   try {
  //     const transaction = await this.paymentTransactionService.findByOrderId(orderId);
  //     return {
  //       success: true,
  //       data: transaction,
  //     };
  //   } catch (error) {
  //     this.logger.error('Error fetching transaction:', error);
  //     return {
  //       success: false,
  //       message: 'Failed to fetch transaction',
  //       error: error.message,
  //     };
  //   }
  // }
}
