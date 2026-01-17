import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { Order } from '../order/entities/order.entity';
import { CreatePaymentTransactionDto } from './dto/create-payment-transaction.dto';
import { DeliveryInfo } from '../delivery-info/entities/delivery-info.entity';
import { User } from '../user/entities/user.entity';
import { OrderStatus } from '../order/dto/order-status.enum';

import { MailService } from '../mail/mail.service';

@Injectable()
export class PaymentTransactionService {
  constructor(
    @InjectRepository(PaymentTransaction)
    private paymentTransactionRepository: Repository<PaymentTransaction>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(DeliveryInfo)
    private deliveryInfoRepository: Repository<DeliveryInfo>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private mailService: MailService,
  ) { }

  // ... (keeping createTransaction as it is, or can also be wrapped if needed)
  async createTransaction(
    paymentData: CreatePaymentTransactionDto,
  ): Promise<{ transaction: PaymentTransaction; order: Order }> {
    //Find ỏder ID on payementData
    const order = await this.orderRepository.findOne({
      where: { order_id: paymentData.order_id },
    });

    if (!order) {
      throw new NotFoundException(
        `Order with ID ${paymentData.order_id} not found`,
      );
    }

    const existingTransaction = await this.paymentTransactionRepository.findOne(
      {
        where: {
          order_id: paymentData.order_id,
          status: 'PENDING',
        },
      },
    );

    if (existingTransaction) {
      throw new Error(
        `Order ${paymentData.order_id} has a pending payment. Please complete or cancel the existing payment first.`,
      );
    }

    const transaction = this.paymentTransactionRepository.create({
      method: paymentData.method || 'VIETQR', // Allow method selection, default to VIETQR
      content: paymentData.orderDescription,
      status: 'PENDING',
      order_id: paymentData.order_id,
      bank_name: paymentData.bankCode || undefined,
    });

    const savedTransaction =
      await this.paymentTransactionRepository.save(transaction);

    return { transaction: savedTransaction, order };
  }

  async updateTransactionStatus(
    orderId: number,
    status: string,
    responseData?: any,
  ): Promise<PaymentTransaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = await queryRunner.manager.findOne(PaymentTransaction, {
        where: { order_id: orderId },
        relations: ['order'],
      });

      if (!transaction) {
        throw new NotFoundException(
          `Transaction with order ID ${orderId} not found`,
        );
      }

      transaction.status = status;
      if (responseData) {
        transaction.raw_response = JSON.stringify(responseData);
      }

      // Update transaction
      await queryRunner.manager.save(PaymentTransaction, transaction);

      // If success, update order status
      if (status === 'SUCCESS') {
        console.log(`[PaymentTransactionService] Payment SUCCESS for order ${orderId}. Updating status to PENDING.`);
        await queryRunner.manager.update(
          Order,
          { order_id: orderId },
          { status: OrderStatus.PENDING },
        );
      } else {
        console.log(`[PaymentTransactionService] Payment status updated to ${status} for order ${orderId}.`);
      }

      await queryRunner.commitTransaction();

      // Send email after successful transaction commit
      if (status === 'SUCCESS') {
        this.sendConfirmationEmailAsync(orderId).catch(err => {
          console.error(`[PaymentTransactionService] Critical: Failed to trigger email sending for order ${orderId}`, err);
        });
      }

      return transaction;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private async sendConfirmationEmailAsync(orderId: number) {
    try {
      const { order, deliveryInfo, transaction } = await this.getOrderDetailsForEmail(orderId);
      await this.mailService.sendOrderConfirmation(order, transaction, deliveryInfo);
      console.log(`[PaymentTransactionService] Confirmation email sent successfully for order ${orderId}`);
    } catch (error) {
      console.error(`[PaymentTransactionService] Failed to send confirmation email for order ${orderId}:`, error.message);
    }
  }

  async findByOrderId(orderId: number): Promise<PaymentTransaction> {
    const transaction = await this.paymentTransactionRepository.findOne({
      where: { order_id: orderId },
      relations: ['order']
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with order ID ${orderId} not found`);
    }

    return transaction;
  }

  // async findAll(): Promise<PaymentTransaction[]> {
  //   return await this.paymentTransactionRepository.find({
  //     relations: ['order'],
  //     order: { time: 'DESC' },
  //   });
  // }

  async getOrderDetailsForEmail(orderId: number) {
    const order = await this.orderRepository.findOne({
      where: { order_id: orderId },
      relations: ['cart'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const deliveryInfo = await this.deliveryInfoRepository.findOne({
      where: { order_id: orderId },
    });

    if (!deliveryInfo) {
      throw new NotFoundException(
        `Delivery info for order ID ${orderId} not found`,
      );
    }

    const transaction = await this.paymentTransactionRepository.findOne({
      where: { order_id: orderId, status: 'SUCCESS' },
    });

    if (!transaction) {
      throw new NotFoundException(
        `Successful transaction for order ID ${orderId} not found`,
      );
    }

    return { order, deliveryInfo, transaction };
  }
}
