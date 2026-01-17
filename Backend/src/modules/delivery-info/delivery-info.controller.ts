import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { DeliveryInfoService } from './delivery-info.service';
import { CreateDeliveryInfoDto } from './dto/create-delivery-info.dto';
import { UpdateDeliveryInfoDto } from './dto/update-delivery-info.dto';
import { Crud, CrudController } from '@dataui/crud';
import { DeliveryInfo } from './entities/delivery-info.entity';
import { NotFoundError } from 'rxjs';
import { create } from 'domain';
import { OrderService } from '../order/order.service';
import { OrderDescription } from '../order-description/entities/order-description.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '../order/entities/order.entity';
import { Repository } from 'typeorm';

@Crud({
  model: { type: DeliveryInfo },
  dto: {
    create: CreateDeliveryInfoDto,
    update: UpdateDeliveryInfoDto,
  },
  params: {
    delivery_id: {
      field: 'delivery_id',
      type: 'number',
      primary: true,
    },
  },
})
@Controller('delivery-info')
export class DeliveryInfoController implements CrudController<DeliveryInfo> {
  constructor(
    public readonly service: DeliveryInfoService,
    public readonly orderService: OrderService,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  @Post('create-normal-order-delivery-info')
  async createNormalDeliveryInfo(
    @Body('order_id') orderId: number,
    @Body('') createDeliveryInfoDto: CreateDeliveryInfoDto,
  ) {
    const deliveryInfo = await this.service.createDeliveryInfo(
      createDeliveryInfoDto,
    );

    // calcualte sum of normal delivery
    const { normalSubtotal, normalDeliveryFee } =
      await this.orderService.calculateNormalDeliveryFee(orderId);

    const subtotal = normalSubtotal;
    const deliveryFee = normalDeliveryFee;

    const order = await this.orderService.findOne({
      where: { order_id: orderId },
    });
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: `Order ID according to delivery_info not found`,
      });
    }

    // Add VAT (10%) to subtotal before saving
    order.subtotal = subtotal * 1.1;
    order.delivery_fee = deliveryFee;
    await this.orderRepository.save(order);

    return deliveryInfo;
  }
}
