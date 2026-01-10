import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { OrderDescription } from './entities/order-description.entity';
import { Order } from '../order/entities/order.entity';
import { ProductInCart } from '../product-in-cart/entities/product-in-cart.entity';
import { OrderService } from '../order/order.service';
@Injectable()
export class OrderDescriptionService extends TypeOrmCrudService<OrderDescription> {
  constructor(
    @InjectRepository(OrderDescription)
    private readonly orderDescriptionRepository: Repository<OrderDescription>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(ProductInCart)
    private readonly productInCartRepository: Repository<ProductInCart>,
  ) {
    super(orderDescriptionRepository);
  }

  // create order_description matching product_in_cart for an order; is_rush initially set to 'NO'
  async createOrderDescription(orderId: number, productIds: number[]) {
    // check if order exist
    const order = await this.orderRepository.findOne({
      where: { order_id: orderId },
    });
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: `Order ${orderId} not found`,
      });
    }

    // get product_in_cart according to order
    const productInCart = await this.productInCartRepository.find({
      where: {
        cart_id: order.cart_id,
        product_id: In(productIds),
      },
    });

    // create order_description for matching productIds
    const orderDescriptions = productInCart.map((pic) => {
      const od = new OrderDescription();
      od.order_id = order.order_id;
      od.product_id = pic.product_id;
      od.quantity = pic.quantity;

      return od;
    });
    await this.orderDescriptionRepository.save(orderDescriptions);
    return {
      success: true,
      message: `Order descriptions for product ${productIds.join(', ')} are created successfully`,
    };
  }




  // delete product in order
  async deleteProductInOrder(orderId: number, productIds: number[]) {
    await this.orderDescriptionRepository.delete({
      order_id: orderId,
      product_id: In(productIds)
    });
  }


}
