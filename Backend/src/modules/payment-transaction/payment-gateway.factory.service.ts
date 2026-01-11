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
        // Default to VietQR if not specified or unknown for now (as requested by user "Default thanh toán bằng QR")
        // However, usually we should throw. But let's support 'VIETQR' explicitly.
        // If legacy 'VNPAY' comes in, we can map it or throw.
        if (method === 'VNPAY') {
          throw new Error('VNPAY is no longer supported. Please use VIETQR.');
        }
        return this.vietqrService;
    }
  }
}
