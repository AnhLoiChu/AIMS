import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { CartService } from '../cart/cart.service';
import { OrderDescriptionService } from '../order-description/order-description.service';
import { Order } from './entities/order.entity';
import { Cart } from '../cart/entities/cart.entity';
import { User } from '../user/entities/user.entity';
import { Role, RoleName } from '../role/entities/role.entity';
import { OrderStatus } from './dto/order-status.enum';
import { CreateDeliveryInfoDto } from '../delivery-info/dto/create-delivery-info.dto';

describe('OrderController', () => {
  let controller: OrderController;
  let orderService: OrderService;
  let cartService: CartService;
  let orderDescriptionService: OrderDescriptionService;
  let orderRepository: Repository<Order>;

  const mockOrderService = {
    findOne: jest.fn(),
    checkRushOrderEligibility: jest.fn(),
    createOrder: jest.fn(),
    removeOrder: jest.fn(),
    checkProductAvailability: jest.fn(),
    calculateNormalDeliveryFee: jest.fn(),
    calculateRushDeliveryFee: jest.fn(),
    processRushOrder: jest.fn(),
    approveOrRejectOrder: jest.fn(),
    updateOrderStatus: jest.fn(),
    getPendingOrders: jest.fn(),
  };

  const mockCartService = {
    findOne: jest.fn(),
  };

  const mockOrderDescriptionService = {
    extendRushOrderDescription: jest.fn(),
  };

  const mockOrderRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
        {
          provide: CartService,
          useValue: mockCartService,
        },
        {
          provide: OrderDescriptionService,
          useValue: mockOrderDescriptionService,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
    orderService = module.get<OrderService>(OrderService);
    cartService = module.get<CartService>(CartService);
    orderDescriptionService = module.get<OrderDescriptionService>(
      OrderDescriptionService,
    );
    orderRepository = module.get<Repository<Order>>(getRepositoryToken(Order));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('rush-process/:order_id', () => {
    // Mock entities with correct structure
    const mockCustomerRole: Role = {
      role_id: 1,
      name: RoleName.CUSTOMER,
    };

    const mockUser: User = {
      user_id: 1,
      name: 'Test User',
      email: 'test@example.com',
      phone: '+84123456789',
      password: 'hashedpassword',
      roles: [mockCustomerRole],
      is_active: true,
      edit_count: 0,
      delete_count: 0,
    };

    const mockCart: Cart = {
      cart_id: 1,
      customer_id: 1,
      customer: mockUser,
    };

    const mockOrder: Order = {
      order_id: 1,
      cart_id: 1,
      subtotal: 100,
      status: OrderStatus.PENDING,
      accept_date: new Date(),
      delivery_fee: 10,
      cart: mockCart,
    };

    const mockDeliveryInfoDto: CreateDeliveryInfoDto = {
      recipient_name: 'John Doe',
      email: 'john@example.com',
      phone: '+84123456789',
      province: 'HN',
      address: '123 Hanoi Street',
      instruction: 'Call before delivery',
      delivery_time: new Date(Date.now() + 3600000), // 1 hour in future
    };

    describe('Success Scenarios', () => {
      it('should process rush order successfully when eligible', async () => {
        // Arrange
        const orderId = 1;
        const mockProcessResult = {
          success: true,
          eligibilityMessage:
            '2 out of 3 products are eligible for rush delivery',
          updateMessage: 'Updated 2 product(s) for rush delivery in order 1',
        };

        mockOrderService.processRushOrder.mockResolvedValue(mockProcessResult);

        // Act
        const result = await controller.processRushOrder(orderId, mockDeliveryInfoDto);

        // Assert
        expect(mockOrderService.processRushOrder).toHaveBeenCalledWith(orderId, mockDeliveryInfoDto);
        expect(result).toEqual(mockProcessResult);
      });

      it('should handle single eligible product successfully', async () => {
        // Arrange
        const orderId = 1;
        const mockProcessResult = {
          success: true,
          eligibilityMessage:
            '1 out of 1 products are eligible for rush delivery',
          updateMessage: 'Updated 1 product(s) for rush delivery in order 1',
        };

        mockOrderService.processRushOrder.mockResolvedValue(mockProcessResult);

        // Act
        const result = await controller.processRushOrder(orderId, mockDeliveryInfoDto);

        // Assert
        expect(mockOrderService.processRushOrder).toHaveBeenCalledWith(orderId, mockDeliveryInfoDto);
        expect(result).toEqual(mockProcessResult);
      });

      it('should handle multiple eligible products with different quantities', async () => {
        // Arrange
        const orderId = 1;
        const mockProcessResult = {
          success: true,
          eligibilityMessage:
            '3 out of 5 products are eligible for rush delivery',
          updateMessage: 'Updated 3 product(s) for rush delivery in order 1',
        };

        mockOrderService.processRushOrder.mockResolvedValue(mockProcessResult);

        // Act
        const result = await controller.processRushOrder(orderId, mockDeliveryInfoDto);

        // Assert
        expect(mockOrderService.processRushOrder).toHaveBeenCalledWith(orderId, mockDeliveryInfoDto);
        expect(result).toEqual(mockProcessResult);
      });
    });

    describe('Ineligible Scenarios', () => {
      it('should return failure when order is not eligible for rush delivery', async () => {
        // Arrange
        const orderId = 1;
        const mockProcessResult = {
          success: false,
          message: 'Rush delivery is not available in your area',
        };

        mockOrderService.processRushOrder.mockResolvedValue(mockProcessResult);

        // Act
        const result = await controller.processRushOrder(orderId, mockDeliveryInfoDto);

        // Assert
        expect(mockOrderService.processRushOrder).toHaveBeenCalledWith(orderId, mockDeliveryInfoDto);
        expect(result).toEqual(mockProcessResult);
      });

      it('should return failure when no products are eligible for rush delivery', async () => {
        // Arrange
        const orderId = 1;
        const mockProcessResult = {
          success: false,
          message: 'No products are eligible for rush delivery',
        };

        mockOrderService.processRushOrder.mockResolvedValue(mockProcessResult);

        // Act
        const result = await controller.processRushOrder(orderId, mockDeliveryInfoDto);

        // Assert
        expect(mockOrderService.processRushOrder).toHaveBeenCalledWith(orderId, mockDeliveryInfoDto);
        expect(result).toEqual(mockProcessResult);
      });

      it('should return failure when order is in non-Hanoi province', async () => {
        // Arrange
        const orderId = 1;
        const mockProcessResult = {
          success: false,
          message:
            'Rush delivery is only available in Hanoi (HN). Current province: HCM',
        };

        mockOrderService.processRushOrder.mockResolvedValue(mockProcessResult);

        // Act
        const result = await controller.processRushOrder(orderId, mockDeliveryInfoDto);

        // Assert
        expect(mockOrderService.processRushOrder).toHaveBeenCalledWith(orderId, mockDeliveryInfoDto);
        expect(result).toEqual(mockProcessResult);
      });
    });

    describe('Error Scenarios', () => {
      it('should handle NotFoundException when order is not found', async () => {
        // Arrange
        const orderId = 999;
        const notFoundError = new NotFoundException({
          code: 'ORDER_NOT_FOUND',
          message: `Order ${orderId} not found`,
        });

        mockOrderService.processRushOrder.mockRejectedValue(notFoundError);

        // Act & Assert
        await expect(controller.processRushOrder(orderId, mockDeliveryInfoDto)).rejects.toThrow(NotFoundException);

        await expect(controller.processRushOrder(orderId, mockDeliveryInfoDto)).rejects.toMatchObject({
          response: {
            code: 'ORDER_NOT_FOUND',
            message: `Order ${orderId} not found`,
          },
        });

        expect(mockOrderService.processRushOrder).toHaveBeenCalledWith(orderId, mockDeliveryInfoDto);
      });

      it('should handle different delivery info DTOs correctly', async () => {
        // Arrange
        const orderId = 1;
        const differentDeliveryInfoDto: CreateDeliveryInfoDto = {
          recipient_name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '+84987654321',
          province: 'HN',
          address: '456 Hanoi Avenue',
          instruction: 'Leave at front door',
          delivery_time: new Date(Date.now() + 7200000), // 2 hours in future
        };
        const mockProcessResult = {
          success: true,
          eligibilityMessage: '1 out of 1 products are eligible for rush delivery',
          updateMessage: 'Updated 1 product(s) for rush delivery in order 1',
        };

        mockOrderService.processRushOrder.mockResolvedValue(mockProcessResult);

        // Act
        const result = await controller.processRushOrder(orderId, differentDeliveryInfoDto);

        // Assert
        expect(mockOrderService.processRushOrder).toHaveBeenCalledWith(orderId, differentDeliveryInfoDto);
        expect(result).toEqual(mockProcessResult);
      });

      it('should handle rush order with detailed instruction successfully', async () => {
        // Arrange
        const orderId = 1;
        const detailedDeliveryInfoDto: CreateDeliveryInfoDto = {
          recipient_name: 'John Doe',
          email: 'john@example.com',
          phone: '+84123456789',
          province: 'HN',
          address: '123 Hanoi Street',
          instruction: 'Call before delivery. Leave at front door if no answer. Ring doorbell twice.',
          delivery_time: new Date(Date.now() + 3600000),
        };
        const mockProcessResult = {
          success: true,
          eligibilityMessage: '1 out of 1 products are eligible for rush delivery',
          updateMessage: 'Updated 1 product(s) for rush delivery in order 1',
        };

        mockOrderService.processRushOrder.mockResolvedValue(mockProcessResult);

        // Act
        const result = await controller.processRushOrder(orderId, detailedDeliveryInfoDto);

        // Assert
        expect(mockOrderService.processRushOrder).toHaveBeenCalledWith(orderId, detailedDeliveryInfoDto);
        expect(result).toEqual(mockProcessResult);
      });
    });

    describe('Edge Cases', () => {
      it('should handle order with zero eligible products', async () => {
        // Arrange
        const orderId = 1;
        const mockProcessResult = {
          success: false,
          message: 'No products are eligible for rush delivery',
        };

        mockOrderService.processRushOrder.mockResolvedValue(mockProcessResult);

        // Act
        const result = await controller.processRushOrder(orderId, mockDeliveryInfoDto);

        // Assert
        expect(result).toEqual(mockProcessResult);
        expect(mockOrderService.processRushOrder).toHaveBeenCalledWith(orderId, mockDeliveryInfoDto);
      });

      it('should handle order with very large number of eligible products', async () => {
        // Arrange
        const orderId = 1;
        const mockProcessResult = {
          success: true,
          eligibilityMessage:
            '100 out of 100 products are eligible for rush delivery',
          updateMessage: 'Updated 100 product(s) for rush delivery in order 1',
        };

        mockOrderService.processRushOrder.mockResolvedValue(mockProcessResult);

        // Act
        const result = await controller.processRushOrder(orderId, mockDeliveryInfoDto);

        // Assert
        expect(mockOrderService.processRushOrder).toHaveBeenCalledWith(orderId, mockDeliveryInfoDto);
        expect(result).toEqual(mockProcessResult);
      });
    });
  });
});
