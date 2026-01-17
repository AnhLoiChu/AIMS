import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { ProductInCart } from '../product-in-cart/entities/product-in-cart.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartService } from '../cart/cart.service';
import { OrderDescription } from '../order-description/entities/order-description.entity';
import { OrderDescriptionModule } from '../order-description/order-description.module';
import { PaymentTransaction } from '../payment-transaction/entities/payment-transaction.entity';
import { DeliveryInfo } from '../delivery-info/entities/delivery-info.entity';
import { DeliveryInfoModule } from '../delivery-info/delivery-info.module';
import { FeeCalculationModule } from '../fee-calculation/fee-calculation.module';
import { Product } from '../product/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      ProductInCart,
      Cart,
      OrderDescription,
      PaymentTransaction,
      DeliveryInfo,
      Product,
    ]),
    OrderDescriptionModule,
    DeliveryInfoModule,
    FeeCalculationModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule { }
