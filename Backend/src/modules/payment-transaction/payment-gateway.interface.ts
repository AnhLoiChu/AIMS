import { Order } from '../order/entities/order.entity';
import { CreatePaymentTransactionDto } from './dto/create-payment-transaction.dto';

export type PaymentResponseType = 'REDIRECT' | 'QR_IMAGE' | 'QR_DATA';

export interface PaymentResponse {
  url: string;
  type: PaymentResponseType;
}

export interface PaymentGateway {
  getPaymentMethodName(): string;
  processPayment(
    ipAddr: string,
    order: Order,
    paymentData: CreatePaymentTransactionDto,
  ): Promise<PaymentResponse>;
}
