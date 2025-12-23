import { forwardRef, Module } from '@nestjs/common';
import { OrderDescriptionService } from './order-description.service';
import { OrderDescriptionController } from './order-description.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderDescription } from './entities/order-description.entity';
import { Order } from '../order/entities/order.entity';
import { ProductInCart } from '../product-in-cart/entities/product-in-cart.entity';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [TypeOrmModule.forFeature([OrderDescription, Order, ProductInCart]), forwardRef(() => OrderModule)],
  controllers: [OrderDescriptionController],
  providers: [OrderDescriptionService],
  exports: [OrderDescriptionService],
})
export class OrderDescriptionModule {}
