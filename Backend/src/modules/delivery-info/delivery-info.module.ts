import { forwardRef, Module } from '@nestjs/common';
import { DeliveryInfoService } from './delivery-info.service';
import { DeliveryInfoController } from './delivery-info.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryInfo } from './entities/delivery-info.entity';
import { Order } from '../order/entities/order.entity';
import { OrderService } from '../order/order.service';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeliveryInfo, Order]),
    forwardRef(() => OrderModule),
  ],
  controllers: [DeliveryInfoController],
  providers: [DeliveryInfoService],
  exports: [DeliveryInfoService, TypeOrmModule],
})
export class DeliveryInfoModule {}
