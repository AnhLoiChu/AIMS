import { Injectable } from '@nestjs/common';
import { VietQRService } from './vietqr.service';
import { PayPalService } from './paypal.service';
import { PaymentGateway } from './payment-gateway.interface';

@Injectable()
export class PaymentGatewayFactory {
  constructor(
    private readonly vietqrService: VietQRService,
    private readonly paypalService: PayPalService,
  ) { }

  createGateway(method: string): PaymentGateway {
    switch (method?.toUpperCase()) {
      case 'VIETQR':
      case 'QRCODE':
        return this.vietqrService;
      case 'PAYPAL':
        return this.paypalService;
      default:
        // Default to VietQR if not specified or unknown
        return this.vietqrService;
    }
  }
}
