import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order } from './entities/order.entity';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { ProductInCart } from '../product-in-cart/entities/product-in-cart.entity';
import { Cart } from '../cart/entities/cart.entity';
import { OrderDescription } from '../order-description/entities/order-description.entity';
import { PaymentTransaction } from '../payment-transaction/entities/payment-transaction.entity';
import { DeliveryInfo } from '../delivery-info/entities/delivery-info.entity';
import { Product } from '../product/entities/product.entity';
import { ApproveOrderDto } from './dto/approve-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from './dto/order-status.enum';
import { SchedulerRegistry } from '@nestjs/schedule';
import { OrderDescriptionService } from '../order-description/order-description.service';
import { DeliveryInfoService } from '../delivery-info/delivery-info.service';
import { CreateDeliveryInfoDto } from '../delivery-info/dto/create-delivery-info.dto';
import { FeeCalculationService } from '../fee-calculation/fee-calculation.service';

@Injectable()
export class OrderService extends TypeOrmCrudService<Order> {
  constructor(
    @InjectRepository(Order)
    public readonly orderRepository: Repository<Order>,
    @InjectRepository(ProductInCart)
    public readonly productInCartRepository: Repository<ProductInCart>,
    @InjectRepository(Cart)
    public readonly cartRepository: Repository<Cart>,
    @InjectRepository(OrderDescription)
    public readonly orderDescriptionRepository: Repository<OrderDescription>,
    @InjectRepository(PaymentTransaction)
    public readonly paymentTransactionRepository: Repository<PaymentTransaction>,
    @InjectRepository(DeliveryInfo)
    public readonly deliveryInfoRepository: Repository<DeliveryInfo>,
    @InjectRepository(Product)
    public readonly productRepository: Repository<Product>,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly orderDescriptionService: OrderDescriptionService,
    private readonly deliveryInfoService: DeliveryInfoService,
    private readonly feeCalculationService: FeeCalculationService,
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
    const items = await this.orderDescriptionRepository.find({
      where: {
        order_id: orderId,
      },
      relations: ['product'],
    });

    // Debug log to see what items are included
    console.log(`Debug Order ${orderId} Items:`);
    items.forEach(i => console.log(` - Product ${i.product_id}: Price=${i.product.current_price}, Qty=${i.quantity}`));

    if (items.length === 0) {
      return {
        normalSubtotal: 0,
        normalDeliveryFee: 0,
      };
    }

    const normalSubtotal = items.reduce(
      (sum, item) => sum + item.product.current_price * item.quantity,
      0,
    );

    const deliveryInfo = await this.deliveryInfoRepository.findOne({
      where: { order_id: orderId },
    });

    if (!deliveryInfo) {
      throw new NotFoundException({
        code: 'DELIVERY_INFO_NOT_FOUND',
        message: `Need delivery info to calculate delivery fee`,
      });
    }

    // Sử dụng FeeCalculationService với Strategy Pattern
    const result = this.feeCalculationService.calculateFee({
      items: items.map((item) => ({
        product: {
          weight: item.product.weight,
          dimensions: item.product.dimensions,
          value: item.product.current_price,
        },
        quantity: item.quantity,
      })),
      province: deliveryInfo.province,
      subtotal: normalSubtotal,
    });

    return {
      normalSubtotal,
      normalDeliveryFee: result.finalFee,
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
      const subtotal = desc.quantity * desc.product.current_price;
      return {
        product_id: desc.product_id,
        price: desc.product.current_price,
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
    const queryRunner = this.orderRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(Order, {
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

        // REDUCE STOCK when accepted
        console.log(`[OrderService] Decreasing stock for order ID ${orderId}`);
        const orderDescriptions = await queryRunner.manager.find(OrderDescription, {
          where: { order_id: orderId },
          relations: ['product'],
        });

        for (const item of orderDescriptions) {
          if (item.product) {
            console.log(`[OrderService] Product ${item.product.title} (ID: ${item.product_id}) old stock: ${item.product.quantity}, requested: ${item.quantity}`);
            const newQuantity = item.product.quantity - item.quantity;
            if (newQuantity < 0) {
              throw new BadRequestException(`Insufficient stock for product ${item.product.title}`);
            }
            await queryRunner.manager.update(Product, item.product_id, {
              quantity: newQuantity
            });
            console.log(`[OrderService] Product ${item.product.title} updated to new stock: ${newQuantity}`);
          }
        }
      } else if (dto.status === OrderStatus.REJECTED) {
        order.status = OrderStatus.REJECTED;
        order.accept_date = new Date();
      } else {
        throw new BadRequestException('Invalid status for approval/rejection');
      }

      await queryRunner.manager.save(Order, order);
      await queryRunner.commitTransaction();

      return { message: `Order ${orderId} has been ${order.status}` };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
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

    // Add VAT (10%) to subtotal before saving
    order.subtotal = subtotal * 1.1;
    order.delivery_fee = deliveryFee;

    await this.orderRepository.save(order);

    return {
      message: `Order ${orderId}: delivery fee and subtotal updated successfully`,
      subtotal,
      deliveryFee,
    };
  }

  async getOrdersByUserId(userId: number) {
    console.log(`[OrderService] Fetching orders for userId: ${userId} (type: ${typeof userId})`);

    // Find all carts belonging to this user
    const carts = await this.cartRepository.find({
      where: { customer_id: userId }
    });

    const cartIds = carts.map(c => c.cart_id);

    // BACKWARD COMPATIBILITY / FE BUG FIX:
    // The Frontend often uses user.id as cartId (e.g., ShoppingCart.tsx:47)
    // If the actual cart assigned to the user has a different ID, the order 
    // history based only on assigned carts will miss orders created with userId.
    if (!cartIds.includes(userId)) {
      cartIds.push(userId);
    }

    console.log(`[OrderService] Found final cart IDs to search for user ${userId}:`, cartIds);

    if (cartIds.length === 0) {
      return [];
    }

    console.log(`[OrderService] Querying orders for cartIds:`, cartIds);
    const orders = await this.orderRepository.find({
      where: {
        cart_id: In(cartIds)
      },
      order: {
        order_id: 'DESC',
      },
    });

    console.log(`[OrderService] Found ${orders.length} orders:`, orders.map(o => o.order_id));

    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const orderItems = await this.orderDescriptionRepository.find({
          where: { order_id: order.order_id },
          relations: ['product'],
        });

        const deliveryInfo = await this.deliveryInfoRepository.findOne({
          where: { order_id: order.order_id },
        });

        const paymentTransaction = await this.paymentTransactionRepository.findOne({
          where: { order_id: order.order_id },
        });

        return {
          ...order,
          items: orderItems.map((item) => ({
            product_name: item.product?.title || 'Unknown Product',
            quantity: item.quantity,
            price: item.product?.current_price || 0,
          })),
          deliveryInfo,
          paymentTransaction,
        };
      }),
    );

    return ordersWithDetails;
  }
}
