import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { PaymentGateway } from './payment-gateway.interface';

@Injectable()
export class PaymentGatewayFactory implements OnModuleInit {
  private readonly registry = new Map<string, PaymentGateway>();

  constructor(
    @Inject('PAYMENT_GATEWAYS')
    private readonly gateways: PaymentGateway[]
  ) { }

  onModuleInit() {
    this.gateways.forEach(gateway => {
      this.registry.set(gateway.getPaymentMethodName().toUpperCase(), gateway);
    });
  }

  createGateway(method: string): PaymentGateway {
    const gateway = this.registry.get(method?.toUpperCase());
    if (!gateway) {
      // Default to the first gateway if not found, or use VIETQR specifically
      return this.registry.get('VIETQR') || this.gateways[0];
    }
    return gateway;
  }
}
