import { Injectable } from '@nestjs/common';
import { VNPayService } from './vnpay.service';
import { PaymentGateway } from './payment-gateway.interface';

@Injectable()
export class PaymentGatewayFactory {
  constructor(private readonly vnpayService: VNPayService) {}

  createGateway(method: string): PaymentGateway {
    switch (method) {
      case 'VNPAY':
        return this.vnpayService;
      default:
        throw new Error(`Unsupported: ${method}`);
    }
  }
}
