import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PayOrderController } from './payment-transaction.controller';
import { VietQRController } from './vietqr.controller';
import { VietQRService } from './vietqr.service';
import { PaymentTransactionService } from './payment-transaction.service';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { Order } from '../order/entities/order.entity';
import { UserModule } from '../user/user.module';
import { DeliveryInfoModule } from '../delivery-info/delivery-info.module';
import { MailModule } from '../mail/mail.module';
import { PaymentGatewayFactory } from './payment-gateway.factory.service';
import { PayPalService } from './paypal.service';
import { PayPalController } from './paypal.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentTransaction, Order]),
    ConfigModule,
    UserModule,
    DeliveryInfoModule,
    MailModule,
  ],
  controllers: [PayOrderController, VietQRController, PayPalController],
  providers: [VietQRService, PayPalService, PaymentTransactionService, PaymentGatewayFactory],
  exports: [VietQRService, PayPalService, PaymentTransactionService, PaymentGatewayFactory],
})
export class PaymentTransactionModule { }
