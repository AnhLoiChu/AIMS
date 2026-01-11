import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Patch,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Crud, CrudController } from '@dataui/crud';
import { Order } from './entities/order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CartService } from '../cart/cart.service';
import { OrderDescription } from '../order-description/entities/order-description.entity';
import { OrderDescriptionService } from '../order-description/order-description.service';
import { Repository } from 'typeorm';
import { ApproveOrderDto } from './dto/approve-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreateDeliveryInfoDto } from '../delivery-info/dto/create-delivery-info.dto';

// @Crud({
//   model: { type: Order },
//   dto: {
//     create: CreateOrderDto,
//     update: UpdateOrderDto,
//   },
//   params: {
//     order_id: {
//       field: 'order_id',
//       type: 'number',
//       primary: true,
//     },
//   },
// })
@Controller('order')
export class OrderController {
  constructor(
    public readonly service: OrderService,
    private readonly orderDescriptionService: OrderDescriptionService,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  // create a new order according to cartId; other fields will be filled later and no order_description related yet
  @Post('create')
  async createOrder(
    @Body('cart_id') cartId: number,
    @Body('product_ids') productIds: number[],
  ) {
    const order = await this.service.createOrder(cartId);
    const orderDescriptions =
      await this.orderDescriptionService.createOrderDescription(
        order.order_id,
        productIds,
      );
    const checkProductAvailability = await this.service.checkProductAvailability(order.order_id);
    if (checkProductAvailability.success != true) {
      await this.orderDescriptionService.deleteProductInOrder(
        order.order_id,
        productIds
      );

      throw new BadRequestException({
        code: 'PRODUCT_NOT_SUFFICIENT',
        message: `Insufficient stock for order ID ${order.order_id}`
      });
    }

    const rushable = await this.service.checkRushOrderAvailable(order.order_id);

    return {
      order,
      orderDescriptions,
      rushable,
    };
  }

  @Post('create-rush')
  async processRushOrder(
    @Body('order_id') orderId: number,
    @Body() dto: CreateDeliveryInfoDto,
  ) {
    return await this.service.processRushOrder(orderId, dto);
  }

  @Post('remove/:order_id')
  async removeOrder(@Param('order_id') orderId: number) {
    return await this.service.removeOrder(orderId);
  }

  @Get('check-product-availability/:order_id')
  // check if product is available for given cartId
  async checkProductAvailability(@Param('order_id') orderId: number) {
    const order = await this.service.findOne({ where: { order_id: orderId } });
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: `Order ${orderId} not found`,
      });
    }
    return await this.service.checkProductAvailability(orderId);
  }

  // @Post('calculate-delivery-fee/:order_id')
  // async calculateDeliveryFee(@Param('order_id') orderId: number) {
  //   const { normalSubtotal, normalDeliveryFee } =
  //     await this.service.calculateNormalDeliveryFee(orderId);
  //   const { rushSubtotal, rushDeliveryFee } =
  //     await this.service.calculateRushDeliveryFee(orderId);

  //   const subtotal = normalSubtotal + rushSubtotal;
  //   const deliveryFee = normalDeliveryFee + rushDeliveryFee;

  //   const order = await this.service.findOne({
  //     where: { order_id: orderId },
  //   });

  //   if (!order) {
  //     throw new NotFoundException({
  //       code: 'ORDER_NOT_FOUND',
  //       message: `Order ID ${orderId} not found`,
  //     });
  //   }

  //   order.subtotal = subtotal;
  //   order.delivery_fee = deliveryFee;

  //   await this.orderRepository.save(order);
  //   return {
  //     message: `Order ${orderId}: delivery fee and subtotal updated successfully`,
  //     subtotal,
  //     deliveryFee,
  //   };
  // }

  // // display invoice
  // @Get('invoice/:order_id')
  // async displayInvoice(@Param('order_id') orderId: number) {
  //   return await this.service.displayInvoice(orderId);
  // }

  // @Patch('approve-reject/:order_id')
  // async approveOrRejectOrder(
  //   @Param('order_id') orderId: number,
  //   @Body() dto: ApproveOrderDto,
  // ) {
  //   return this.service.approveOrRejectOrder(orderId, dto);
  // }

  // @Patch('update-status/:order_id')
  // async updateOrderStatus(
  //   @Param('order_id') orderId: number,
  //   @Body() dto: UpdateOrderStatusDto,
  // ) {
  //   return this.service.updateOrderStatus(orderId, dto);
  // }

  // @Get('pending-orders')
  // async getPendingOrders() {
  //   return this.service.getPendingOrders();
  // }
}
