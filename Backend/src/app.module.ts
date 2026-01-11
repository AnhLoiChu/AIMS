import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomerModule } from './modules/customer/customer.module';
import { ManagerModule } from './modules/manager/manager.module';
import { AdministratorModule } from './modules/administrator/administrator.module';
import { CartModule } from './modules/cart/cart.module';
import { ProductModule } from './modules/product/product.module';
import { ProductInCartModule } from './modules/product-in-cart/product-in-cart.module';
import { OrderModule } from './modules/order/order.module';
import { OrderDescriptionModule } from './modules/order-description/order-description.module';
import { DeliveryInfoModule } from './modules/delivery-info/delivery-info.module';
import { PaymentTransactionModule } from './modules/payment-transaction/payment-transaction.module';
import { DataSource } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MailModule } from './modules/mail/mail.module';
import { AuthModule } from './modules/auth/auth.module';
import { EditHistoryModule } from './modules/edit-history/edit-history.module';
// npm install @nestjs/schedule

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(typeOrmConfig),
    CustomerModule,
    ManagerModule,
    AdministratorModule,
    CartModule,
    ProductModule,
    ProductInCartModule,
    OrderModule,
    OrderDescriptionModule,
    DeliveryInfoModule,
    PaymentTransactionModule,
    MailModule,
    AuthModule,
    EditHistoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
