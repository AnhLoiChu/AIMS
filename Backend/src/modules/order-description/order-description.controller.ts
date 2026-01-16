import { Get, Body, Controller, Param, Post } from '@nestjs/common';
import { OrderDescriptionService } from './order-description.service';
import { CreateOrderDescriptionDto } from './dto/create-order-description.dto';
import { UpdateOrderDescriptionDto } from './dto/update-order-description.dto';
import { OrderDescription } from './entities/order-description.entity';
import { Crud, CrudController } from '@dataui/crud';

@Crud({
  model: { type: OrderDescription },
  dto: {
    create: CreateOrderDescriptionDto,
    update: UpdateOrderDescriptionDto,
  },
  params: {
    order_id: {
      field: 'order_id',
      type: 'number',
      primary: true,
    },
    product_id: {
      field: 'product_id',
      type: 'number',
      primary: true,
    },
  },
})
@Controller('order-description')
export class OrderDescriptionController
  implements CrudController<OrderDescription>
{
  constructor(public readonly service: OrderDescriptionService) {}

  // create order_description when customer reviews cart and choose products to place order
  // @Post('create/:order_id')
  // async createOrderDescription(
  //   @Param('order_id') orderId: number,
  //   @Body('productIds') productIds: number[],
  // ) {
  //   return await this.service.createOrderDescription(orderId, productIds);
  // }


}
