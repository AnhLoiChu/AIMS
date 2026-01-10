import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { ProductInCart } from '../product-in-cart/entities/product-in-cart.entity';
import { Cart } from '../cart/entities/cart.entity';
import { OrderDescription } from '../order-description/entities/order-description.entity';
import { PaymentTransaction } from '../payment-transaction/entities/payment-transaction.entity';
import { DeliveryInfo } from '../delivery-info/entities/delivery-info.entity';
import { ApproveOrderDto } from './dto/approve-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from './dto/order-status.enum';
import { SchedulerRegistry } from '@nestjs/schedule';
import { OrderDescriptionService } from '../order-description/order-description.service';
import { DeliveryInfoService } from '../delivery-info/delivery-info.service';
import { CreateDeliveryInfoDto } from '../delivery-info/dto/create-delivery-info.dto';

@Injectable()
export class OrderService extends TypeOrmCrudService<Order> {
  constructor(
    @InjectRepository(Order)
    public readonly orderRepository: Repository<Order>,
    @InjectRepository(ProductInCart)
    public readonly productInCartRepository: Repository<ProductInCart>,
    @InjectRepository(ProductInCart)
    public readonly cartRepository: Repository<Cart>,
    @InjectRepository(OrderDescription)
    public readonly orderDescriptionRepository: Repository<OrderDescription>,
    @InjectRepository(PaymentTransaction)
    public readonly paymentTransactionRepository: Repository<PaymentTransaction>,
    @InjectRepository(DeliveryInfo)
    public readonly deliveryInfoRepository: Repository<DeliveryInfo>,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly orderDescriptionService: OrderDescriptionService,
    private readonly deliveryInfoService: DeliveryInfoService,
  ) {
    super(orderRepository);
  }

  // create a new order according to cartId; other fields will be filled later and no order_description related yet
  async createOrder(cartId: number) {
    const cart = await this.cartRepository.findOne({
      where: { cart_id: cartId },
    });
    if (!cart) {
      throw new NotFoundException(
        `Cannot create order because cart ID ${cartId} not found`,
      );
    }

    const newOrder = this.orderRepository.create({
      // order_id: newOrderId, // Remove this if order_id is auto-generated
      cart_id: cartId,
      cart: cart,
      subtotal: 0,
      status: OrderStatus.PLACING,
      accept_date: null,
      delivery_fee: 0,
    });
    const savedOrder = await this.orderRepository.save(newOrder);

    // timeout 10 mins for order
    const timeout = setTimeout(
      () => {
        this.orderRepository
          .findOne({
            where: { order_id: savedOrder.order_id },
          })
          .then(async (order) => {
            if (order && order.status === OrderStatus.PLACING) {
              await this.removeOrder(savedOrder.order_id);
              console.log(
                `Order ID ${savedOrder.order_id} auto-deleted after 10 mins`,
              );
            }
          })
          .catch((err) => {
            console.error('Error in auto-delete timeout:', err);
          });
      },
      10 * 60 * 1000,
    );

    // save timeout for later management
    this.schedulerRegistry.addTimeout(`order-${savedOrder.order_id}`, timeout);

    return savedOrder;
  }

  // check product availability in database
  async checkProductAvailability(orderId: number) {
    // all product_in_cart
    const orderDescription = await this.orderDescriptionRepository.find({
      where: { order_id: orderId },
      relations: ['product'], // allow load Product entity to access available quantity
    });

    if (orderDescription.length === 0) {
      throw new BadRequestException({
        code: 'ORDER_DESCRIPTION_NOT_FOUND',
        message: `No order description matching ${orderId}`,
      });
    }

    const insufficientProducts: {
      product_id: number;
      request_quantity: number;
      available_quantity: number;
      message: string;
    }[] = [];
    for (const item of orderDescription) {
      const available = item.product.quantity;
      const request = item.quantity;
      const productId = item.product.product_id;

      if (request > available) {
        insufficientProducts.push({
          product_id: productId,
          request_quantity: request,
          available_quantity: available,
          message: `Product ID ${productId} is insufficient`,
        });
      }
    }

    if (insufficientProducts.length > 0) {
      throw new BadRequestException({
        code: 'PRODUCTS_INSUFFICIENT',
        message: 'Some products do not have enough stock',
        insufficient_products: insufficientProducts,
      });
    }

    return {
      success: true,
      message: `All products are sufficient for order ID ${orderId}`,
    };
  }

  // display order with transaction
  async getOrderWithTransaction(orderId: number) {
    const order = await this.orderRepository.findOne({
      where: { order_id: orderId },
      // relations: ['paymentTransaction']
    });

    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: `Order with ID ${orderId} does not exist`,
      });
    }

    const paymentTransaction = await this.paymentTransactionRepository.findOne({
      where: { order_id: orderId },
    });
    if (!paymentTransaction) {
      throw new BadRequestException({
        code: 'ORDER_NOT_PAID',
        message: `Payment transaction not found for order ID ${orderId}`,
      });
    }

    return {
      success: true,
      data: order,
      paymentTransaction,
    };
  }

  // calculate delivery fee for normal items
  async calculateNormalDeliveryFee(orderId: number) {
    let normalSubtotal = 0;
    let maxWeight = 0;
    let normalDeliveryFee = 0;

    const items = await this.orderDescriptionRepository.find({
      where: {
        order_id: orderId,
      },
      relations: ['product'],
    });
    if (items.length === 0) {
      return {
        normalSubtotal,
        normalDeliveryFee,
      };
    }

    for (const item of items) {
      normalSubtotal += item.product.value * item.quantity;
      if (item.product.weight * item.quantity > maxWeight) {
        maxWeight = item.product.weight * item.quantity;
      }
    }

    const deliveryInfo = await this.deliveryInfoRepository.findOne({
      where: { order_id: orderId },
    });
    if (!deliveryInfo) {
      throw new NotFoundException({
        code: 'DELIVERY_INFO_NOT_FOUND',
        message: `Need delivery info to calculate delivery fee`,
      });
    }

    if (['HN', 'HCM'].includes(deliveryInfo.province)) {
      normalDeliveryFee = 22000;
      if (maxWeight > 3) {
        normalDeliveryFee += ((maxWeight - 3) / 0.5) * 2500;
      }
    } else {
      normalDeliveryFee = 30000;
      if (maxWeight > 0.5) {
        normalDeliveryFee += ((maxWeight - 0.5) / 0.5) * 2500;
      }
    }

    if (normalSubtotal > 100000) {
      normalDeliveryFee -= 25000;
    }
    return {
      normalSubtotal,
      normalDeliveryFee,
    };
  }






  // calculate delivery fee for rush items


  // display invoice
  async displayInvoice(orderId: number) {
    const order = await this.orderRepository.findOne({
      where: { order_id: orderId },
    });
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: `Order ID ${orderId} not found`,
      });
    }

    const orderDescriptions = await this.orderDescriptionRepository.find({
      where: { order_id: orderId },
      relations: ['product'],
    });
    if (orderDescriptions.length === 0) {
      throw new BadRequestException({
        code: 'ORDER_DESCRIPTION_NOT_FOUND',
        message: `Order descriptions for order ID ${orderId} not found`,
      });
    }

    const items = orderDescriptions.map((desc) => {
      const subtotal = desc.quantity * desc.product.value;
      return {
        product_id: desc.product_id,
        price: desc.product.value,
        quantity: desc.quantity,
        subtotal,
      };
    });

    const subtotalSum = items.reduce((sum, item) => sum + item.subtotal, 0);
    const vat = subtotalSum * 0.1;
    const total = subtotalSum + vat;
    const allTotal = total + order.delivery_fee;

    return {
      items,
      subtotalSum,
      vat,
      total,
      delivery_fee: order.delivery_fee,
      allTotal: allTotal,
    };
  }

  // remove an order
  async removeOrder(orderId: number) {
    try {
      // delete order_description first to avoid foreignkey constraint
      await this.orderDescriptionRepository
        .createQueryBuilder()
        .delete()
        .from(OrderDescription)
        .where('order_id = :id', { id: orderId })
        .execute();

      // delete payment_transaction first to avoid foreignkey constraint
      await this.paymentTransactionRepository
        .createQueryBuilder()
        .delete()
        .from(PaymentTransaction)
        .where('order_id = :id', { id: orderId })
        .execute();

      // delete order
      const result = await this.orderRepository
        .createQueryBuilder()
        .delete()
        .from(Order)
        .where('order_id = :id', { id: orderId })
        .execute();

      if (result.affected === 0) {
        throw new BadRequestException({
          code: 'ORDER_NOT_FOUND || ORDER_ALREADY_REMOVED',
          message: `Order ID ${orderId} does not exist or was already removed`,
        });
      } else {
        return {
          success: true,
          message: `Order ID ${orderId} removed successfully`,
        };
      }
    } catch {
      throw new BadRequestException({
        code: 'FAILED_TO_REMOVE_ORDER',
        message: `Failed to remove order ID ${orderId}`,
      });
    }
  }

  async approveOrRejectOrder(orderId: number, dto: ApproveOrderDto) {
    const order = await this.orderRepository.findOne({
      where: { order_id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'Order is not pending and cannot be approved/rejected',
      );
    }
    if (dto.status === OrderStatus.ACCEPTED) {
      order.status = OrderStatus.ACCEPTED;
      order.accept_date = new Date();
    } else if (dto.status === OrderStatus.REJECTED) {
      order.status = OrderStatus.REJECTED;
      order.accept_date = new Date();
      // Optionally save rejection_reason if you add this field to the entity
    } else {
      throw new BadRequestException('Invalid status for approval/rejection');
    }
    await this.orderRepository.save(order);
    return { message: `Order ${orderId} has been ${order.status}` };
  }

  async updateOrderStatus(orderId: number, dto: UpdateOrderStatusDto) {
    const order = await this.orderRepository.findOne({
      where: { order_id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');
    order.status = dto.status;
    await this.orderRepository.save(order);
    return { message: `Order ${orderId} status updated to ${dto.status}` };
  }

  /**
   * Get 30 pending orders for manager approval
   */
  async getPendingOrders() {
    const pendingOrders = await this.orderRepository.find({
      where: {
        status: OrderStatus.PENDING, // "Waiting for Approval"
      },
      relations: ['cart'], // Include cart info
      order: {
        order_id: 'ASC', // Oldest orders first
      },
      take: 30, // Limit to 30 orders
    });

    // Get additional details for each order
    const ordersWithDetails = await Promise.all(
      pendingOrders.map(async (order) => {
        // Get order description items
        const orderItems = await this.orderDescriptionRepository.find({
          where: { order_id: order.order_id },
          relations: ['product'],
        });

        // Get delivery info
        const deliveryInfo = await this.deliveryInfoRepository.findOne({
          where: { order_id: order.order_id },
        });

        // Get payment transaction
        const paymentTransaction =
          await this.paymentTransactionRepository.findOne({
            where: { order_id: order.order_id },
          });

        return {
          ...order,
          orderItems,
          deliveryInfo,
          paymentTransaction,
          totalItems: orderItems.length,
          totalValue: order.subtotal + order.delivery_fee,
        };
      }),
    );

    console.log('===============================================');
    console.log(
      `📋 PENDING ORDERS DISPLAY - ${new Date().toLocaleDateString()}`,
    );
    console.log('===============================================');
    console.log(`📊 Total pending orders: ${pendingOrders.length}`);
    console.log(`🔍 Showing top 30 pending orders`);
    console.log('===============================================');

    // Log each order summary to console
    ordersWithDetails.forEach((order, index) => {
      console.log(`${index + 1}. Order #${order.order_id}`);
      console.log(`   💰 Subtotal: ${order.subtotal.toFixed(2)} VND`);
      console.log(`   🚚 Delivery Fee: ${order.delivery_fee.toFixed(2)} VND`);
      console.log(`   💳 Total Value: ${order.totalValue.toFixed(2)} VND`);
      console.log(`   📦 Items: ${order.totalItems}`);
      console.log(`   📍 Province: ${order.deliveryInfo?.province || 'N/A'}`);
      console.log(`   🏪 Address: ${order.deliveryInfo?.address || 'N/A'}`);
      console.log(
        `   💵 Payment Status: ${order.paymentTransaction ? '✅ Paid' : '⏳ Pending'}`,
      );
      console.log(`   🛒 Cart ID: ${order.cart_id}`);
      console.log('   ---');
    });
    console.log('===============================================');

    return {
      message: `Retrieved ${pendingOrders.length} pending orders`,
      totalPendingOrders: pendingOrders.length,
      orders: ordersWithDetails,
      summary: {
        totalOrders: pendingOrders.length,
        totalValue: ordersWithDetails.reduce(
          (sum, order) => sum + order.totalValue,
          0,
        ),
        paidOrders: ordersWithDetails.filter(
          (order) => order.paymentTransaction,
        ).length,
        unpaidOrders: ordersWithDetails.filter(
          (order) => !order.paymentTransaction,
        ).length,
        averageOrderValue:
          pendingOrders.length > 0
            ? ordersWithDetails.reduce(
                (sum, order) => sum + order.totalValue,
                0,
              ) / pendingOrders.length
            : 0,
      },
    };
  }

  async calculateTotalDeliveryFee(orderId: number): Promise<{
    message: string;
    subtotal: number;
    deliveryFee: number;
  }> {
    const { normalSubtotal, normalDeliveryFee } =
      await this.calculateNormalDeliveryFee(orderId);

    const subtotal = normalSubtotal * 1000;
    const deliveryFee = normalDeliveryFee;

    const order = await this.orderRepository.findOne({
      where: { order_id: orderId },
    });

    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: `Order ID ${orderId} not found`,
      });
    }

    order.subtotal = subtotal;
    order.delivery_fee = deliveryFee;

    await this.orderRepository.save(order);

    return {
      message: `Order ${orderId}: delivery fee and subtotal updated successfully`,
      subtotal,
      deliveryFee,
    };
  }

  // payOrder() {
  //   // empty cart after pay successfully
  // }
}
