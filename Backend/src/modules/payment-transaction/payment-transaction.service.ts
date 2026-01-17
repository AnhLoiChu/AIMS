import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { Order } from '../order/entities/order.entity';
import { CreatePaymentTransactionDto } from './dto/create-payment-transaction.dto';
import { DeliveryInfo } from '../delivery-info/entities/delivery-info.entity';
import { User } from '../user/entities/user.entity';
import { OrderStatus } from '../order/dto/order-status.enum';
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
  ) { }

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
    const transaction = await this.paymentTransactionRepository.findOne({
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

    if (status === 'SUCCESS') {
      await this.orderRepository.update(
        { order_id: orderId },
        { status: OrderStatus.PENDING },
      );
    }

    return await this.paymentTransactionRepository.save(transaction);
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
