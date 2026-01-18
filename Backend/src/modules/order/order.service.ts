import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { Order } from './entities/order.entity';
import { Cart } from '../cart/entities/cart.entity';
import { ProductInCart } from '../product-in-cart/entities/product-in-cart.entity';
import { PaymentTransaction } from '../payment-transaction/entities/payment-transaction.entity';
import { OrderDescription } from '../order-description/entities/order-description.entity';
import { Product } from '../product/entities/product.entity';
import { DeliveryInfo } from '../delivery-info/entities/delivery-info.entity';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ApproveOrderDto } from './dto/approve-order.dto';
import { OrderStatus } from './dto/order-status.enum';
import { OrderDescriptionService } from '../order-description/order-description.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CreateDeliveryInfoDto } from '../delivery-info/dto/create-delivery-info.dto';
import { DeliveryInfoService } from '../delivery-info/delivery-info.service';
import { MailService } from '../mail/mail.service';
import { FeeCalculationService } from '../fee-calculation/fee-calculation.service';

@Injectable()
export class OrderService extends TypeOrmCrudService<Order> {
  constructor(
    @InjectRepository(Order)
    public readonly orderRepository: Repository<Order>,
    @InjectRepository(Cart)
    public readonly cartRepository: Repository<Cart>,
    @InjectRepository(ProductInCart)
    public readonly productInCartRepository: Repository<ProductInCart>,
    @InjectRepository(PaymentTransaction)
    public readonly paymentTransactionRepository: Repository<PaymentTransaction>,
    @InjectRepository(OrderDescription)
    public readonly orderDescriptionRepository: Repository<OrderDescription>,
    @InjectRepository(DeliveryInfo)
    public readonly deliveryInfoRepository: Repository<DeliveryInfo>,
    @InjectRepository(Product)
    public readonly productRepository: Repository<Product>,
    private readonly orderDescriptionService: OrderDescriptionService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly mailService: MailService,
    private readonly deliveryInfoService: DeliveryInfoService,
    private readonly feeCalculationService: FeeCalculationService,
  ) {
    super(orderRepository);
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
      available_quantity: number;
      request_quantity: number;
      message: string;
    }[] = [];
    for (const item of orderDescription) {
      const request = item.quantity;
      const available = item.product.quantity;
      const productId = item.product.product_id;

      if (request > available) {
        insufficientProducts.push({
          product_id: productId,
          available_quantity: available,
          request_quantity: request,
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
      status: OrderStatus.PLACING,
      subtotal: 0,
      delivery_fee: 0,
      accept_date: null,
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
      paymentTransaction,
      data: order,
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
        normalDeliveryFee: 0,
        normalSubtotal: 0,
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
          dimensions: item.product.dimensions,
          weight: item.product.weight,
          value: item.product.current_price,
        },
        quantity: item.quantity,
      })),
      subtotal: normalSubtotal,
      province: deliveryInfo.province,
    });

    return {
      normalDeliveryFee: result.finalFee,
      normalSubtotal,
    };
  }








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
        quantity: desc.quantity,
        price: desc.product.current_price,
        subtotal,
      };
    });

    const subtotalSum = items.reduce((sum, item) => sum + item.subtotal, 0);
    const vat = subtotalSum * 0.1;
    const total = subtotalSum + vat;
    const allTotal = total + order.delivery_fee;

    return {
      items,
      vat,
      subtotalSum,
      total,
      allTotal: allTotal,
      delivery_fee: order.delivery_fee,
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
          message: `Order ID ${orderId} removed successfully`,
          success: true,
        };
      }
    } catch {
      throw new BadRequestException({
        code: 'FAILED_TO_REMOVE_ORDER',
        message: `Failed to remove order ID ${orderId}`,
      });
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
        order.accept_date = new Date();
        order.status = OrderStatus.ACCEPTED;

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
        order.accept_date = new Date();
        order.status = OrderStatus.REJECTED;
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

  /**
   * Get 30 pending orders for manager approval
   */
  async getPendingOrders() {
    const pendingOrders = await this.orderRepository.find({
      where: {
        status: OrderStatus.PENDING, // "Waiting for Approval"
      },
      order: {
        order_id: 'ASC', // Oldest orders first
      },
      relations: ['cart'], // Include cart info
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
          deliveryInfo,
          orderItems,
          paymentTransaction,
          totalValue: order.subtotal + order.delivery_fee,
          totalItems: orderItems.length,
        };
      }),
    );

    console.log('===============================================');
    console.log(
      `📋 PENDING ORDERS DISPLAY - ${new Date().toLocaleDateString()}`,
    );
    console.log('===============================================');
    console.log(`🔍 Showing top 30 pending orders`);
    console.log(`📊 Total pending orders: ${pendingOrders.length}`);
    console.log('===============================================');

    // Log each order summary to console
    ordersWithDetails.forEach((order, index) => {
      console.log(`${index + 1}. Order #${order.order_id}`);
      console.log(`   🚚 Delivery Fee: ${order.delivery_fee.toFixed(2)} VND`);
      console.log(`   💰 Subtotal: ${order.subtotal.toFixed(2)} VND`);
      console.log(`   💳 Total Value: ${order.totalValue.toFixed(2)} VND`);
      console.log(`   📍 Province: ${order.deliveryInfo?.province || 'N/A'}`);
      console.log(`   📦 Items: ${order.totalItems}`);
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
      orders: ordersWithDetails,
      totalPendingOrders: pendingOrders.length,
      summary: {
        totalOrders: pendingOrders.length,
        paidOrders: ordersWithDetails.filter(
          (order) => order.paymentTransaction,
        ).length,
        totalValue: ordersWithDetails.reduce(
          (sum, order) => sum + order.totalValue,
          0,
        ),
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
    subtotal: number;
    message: string;
    deliveryFee: number;
  }> {
    const { normalDeliveryFee, normalSubtotal } =
      await this.calculateNormalDeliveryFee(orderId);

    const deliveryFee = normalDeliveryFee;
    const subtotal = normalSubtotal * 1000;

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
      subtotal,
      message: `Order ${orderId}: delivery fee and subtotal updated successfully`,
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
        const deliveryInfo = await this.deliveryInfoRepository.findOne({
          where: { order_id: order.order_id },
        });

        const orderItems = await this.orderDescriptionRepository.find({
          where: { order_id: order.order_id },
          relations: ['product'],
        });

        const paymentTransaction = await this.paymentTransactionRepository.findOne({
          where: { order_id: order.order_id },
        });

        return {
          ...order,
          deliveryInfo,
          items: orderItems.map((item) => ({
            product_name: item.product?.title || 'Unknown Product',
            price: item.product?.current_price || 0,
            quantity: item.quantity,
          })),
          paymentTransaction,
        };
      }),
    );

    return ordersWithDetails;
  }

  async cancelOrder(orderId: number, userId: number) {
    const order = await this.orderRepository.findOne({
      where: { order_id: orderId },
      relations: ['cart'],
    });

    if (!order) {
      throw new NotFoundException(`Order #${orderId} not found`);
    }

    // Security check: Verify order belongs to the user
    console.log(`[OrderService] Attempting to cancel order ${orderId} for userId ${userId}. Order owner: ${order.cart.customer_id}, cart_id: ${order.cart_id}, status: ${order.status}`);

    const isCompatibilityOwner = Number(order.cart_id) === Number(userId);
    const isOfficialOwner = Number(order.cart.customer_id) === Number(userId);

    if (!isOfficialOwner && !isCompatibilityOwner) {
      console.error(`[OrderService] Unauthorized cancel attempt: User ${userId} is neither official owner (${order.cart.customer_id}) nor compatibility owner (${order.cart_id})`);
      throw new BadRequestException('You are not authorized to cancel this order');
    }

    // Rule: Can only cancel if status is "Waiting for Approval" or "Waiting for Payment"
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PLACING) {
      console.error(`[OrderService] Invalid status for cancel: ${order.status}`);
      throw new BadRequestException(
        `Order cannot be cancelled because its current status is "${order.status}"`,
      );
    }

    const queryRunner = this.orderRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const originalStatus = order.status;
      order.status = OrderStatus.USER_CANCELLED;
      await queryRunner.manager.save(Order, order);

      // Get delivery info for email
      const deliveryInfo = await this.deliveryInfoRepository.findOne({
        where: { order_id: orderId },
      });

      await queryRunner.commitTransaction();

      // Trigger email notification asynchronously ONLY if it was already paid (PENDING)
      if (deliveryInfo && originalStatus === OrderStatus.PENDING) {
        this.mailService.sendOrderCancellation(order, deliveryInfo).catch((err) => {
          console.error(`[OrderService] Failed to send cancellation email for order ${orderId}:`, err);
        });
      }

      return {
        status: order.status,
        message: `Đã hủy đơn hàng #${orderId} thành công.`,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
