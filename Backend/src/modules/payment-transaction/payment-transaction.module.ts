import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PayOrderController } from './payment-transaction.controller';
import { VNPayService } from './vnpay.service';
import { PaymentTransactionService } from './payment-transaction.service';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { Order } from '../order/entities/order.entity';
import { UserModule } from '../user/user.module';
import { DeliveryInfoModule } from '../delivery-info/delivery-info.module';
import { MailModule } from '../mail/mail.module';
import { PaymentGatewayFactory } from './payment-gateway.factory.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentTransaction, Order]),
    ConfigModule,
    UserModule,
    DeliveryInfoModule,
    MailModule,
  ],
  controllers: [PayOrderController],
  providers: [VNPayService, PaymentTransactionService, PaymentGatewayFactory],
  exports: [VNPayService, PaymentTransactionService, PaymentGatewayFactory],
})
export class PaymentTransactionModule {}
