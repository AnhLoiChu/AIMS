import { Order } from '../order/entities/order.entity';
import { CreatePaymentTransactionDto } from './dto/create-payment-transaction.dto';

export interface PaymentGateway {
  createPaymentUrl(
    ipAddr: string,
    order: Order,
    paymentData: CreatePaymentTransactionDto,
  ): string;
}
