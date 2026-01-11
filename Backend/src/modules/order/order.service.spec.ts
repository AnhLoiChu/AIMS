import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { ProductInCart } from '../product-in-cart/entities/product-in-cart.entity';
import { Cart } from '../cart/entities/cart.entity';
import { OrderDescription } from '../order-description/entities/order-description.entity';
import { PaymentTransaction } from '../payment-transaction/entities/payment-transaction.entity';
import { DeliveryInfo } from '../delivery-info/entities/delivery-info.entity';
import { Product } from '../product/entities/product.entity';
import { User } from '../user/entities/user.entity';
import { Role, RoleName } from '../role/entities/role.entity';
import { OrderStatus } from './dto/order-status.enum';
import { OrderDescriptionService } from '../order-description/order-description.service';
import { DeliveryInfoService } from '../delivery-info/delivery-info.service';

// Mock TypeOrmCrudService to avoid real constructor logic
jest.mock('@dataui/crud-typeorm', () => ({
  TypeOrmCrudService: jest.fn().mockImplementation(() => ({})),
}));

describe('OrderService', () => {
  let service: OrderService;
  let orderRepository: any;
  let productInCartRepository: any;
  let cartRepository: any;
  let orderDescriptionRepository: any;
  let paymentTransactionRepository: any;
  let deliveryInfoRepository: any;
  let schedulerRegistry: SchedulerRegistry;
  let orderDescriptionService: any;
  let deliveryInfoService: any;

  beforeEach(async () => {
    orderRepository = {
      create: jest.fn().mockResolvedValue({}),
      save: jest.fn().mockResolvedValue({}),
      findOne: jest.fn().mockResolvedValue(null),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      }),
    };

    productInCartRepository = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    cartRepository = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    orderDescriptionRepository = {
      find: jest.fn().mockResolvedValue([]),
    };

    paymentTransactionRepository = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    deliveryInfoRepository = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    orderDescriptionService = {
      extendRushOrderDescription: jest.fn().mockResolvedValue({
        success: true,
        message: 'Updated 2 product(s) for rush delivery in order 1',
      }),
    };

    deliveryInfoService = {
      createRushOrderDeliveryInfo: jest.fn().mockResolvedValue({}),
    };

    const mockSchedulerRegistry = {
      addTimeout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(Order),
          useValue: orderRepository,
        },
        {
          provide: getRepositoryToken(ProductInCart),
          useValue: productInCartRepository,
        },
        {
          provide: getRepositoryToken(Cart),
          useValue: cartRepository,
        },
        {
          provide: getRepositoryToken(OrderDescription),
          useValue: orderDescriptionRepository,
        },
        {
          provide: getRepositoryToken(PaymentTransaction),
          useValue: paymentTransactionRepository,
        },
        {
          provide: getRepositoryToken(DeliveryInfo),
          useValue: deliveryInfoRepository,
        },
        {
          provide: SchedulerRegistry,
          useValue: mockSchedulerRegistry,
        },
        {
          provide: OrderDescriptionService,
          useValue: orderDescriptionService,
        },
        {
          provide: DeliveryInfoService,
          useValue: deliveryInfoService,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    schedulerRegistry = module.get<SchedulerRegistry>(SchedulerRegistry);

    // Patch the prototype so methods are available
    Object.setPrototypeOf(service, OrderService.prototype);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkRushOrderEligibility', () => {
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

    const mockDeliveryInfoHN: DeliveryInfo = {
      delivery_id: 1,
      recipient_name: 'John Doe',
      email: 'john@example.com',
      phone: '+84123456789',
      order_id: 1,
      province: 'HN',
      address: '123 Hanoi Street',
      instruction: 'Leave at front door',
      delivery_time: new Date(),
      order: mockOrder,
    };

    const mockDeliveryInfoHCM: DeliveryInfo = {
      delivery_id: 2,
      recipient_name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+84987654321',
      order_id: 2,
      province: 'HCM',
      address: '456 Ho Chi Minh Street',
      instruction: 'Call before delivery',
      delivery_time: new Date(),
      order: mockOrder,
    };

    const mockDeliveryInfoOther: DeliveryInfo = {
      delivery_id: 3,
      recipient_name: 'Bob Smith',
      email: 'bob@example.com',
      phone: '+84876543210',
      order_id: 3,
      province: 'Da Nang',
      address: '789 Da Nang Street',
      instruction: 'Ring doorbell',
      delivery_time: new Date(),
      order: mockOrder,
    };

    const mockProductEligible: Product = {
      product_id: 1,
      title: 'Rush Eligible Book',
      value: 29.99,
      quantity: 10,
      current_price: 29.99,
      category: 'book',
      manager_id: 1,
      creation_date: new Date(),
      rush_order_eligibility: true,
      barcode: '123456789',
      description: 'Book eligible for rush delivery',
      weight: 0.5,
      dimensions: '20x15x2',
      type: 'book',
      warehouse_entrydate: new Date(),
      manager: mockUser,
    };

    const mockProductNotEligible: Product = {
      product_id: 2,
      title: 'Regular Book',
      value: 19.99,
      quantity: 5,
      current_price: 19.99,
      category: 'book',
      manager_id: 1,
      creation_date: new Date(),
      rush_order_eligibility: false,
      barcode: '987654321',
      description: 'Book not eligible for rush delivery',
      weight: 0.3,
      dimensions: '18x12x1',
      type: 'book',
      warehouse_entrydate: new Date(),
      manager: mockUser,
    };

    const mockOrderDescriptionEligible: OrderDescription = {
      order_id: 1,
      product_id: 1,
      quantity: 2,
      is_rush: false,
      order: mockOrder,
      product: mockProductEligible,
    };

    const mockOrderDescriptionNotEligible: OrderDescription = {
      order_id: 1,
      product_id: 2,
      quantity: 1,
      is_rush: false,
      order: mockOrder,
      product: mockProductNotEligible,
    };

    it('should return eligible when order is in Hanoi and has eligible products', async () => {
      // Arrange
      const orderId = 1;
      const mockOrderDescriptions = [
        mockOrderDescriptionEligible,
        mockOrderDescriptionNotEligible,
      ];

      orderRepository.findOne.mockResolvedValue(mockOrder);
      deliveryInfoRepository.findOne.mockResolvedValue(mockDeliveryInfoHN);
      orderDescriptionRepository.find.mockResolvedValue(mockOrderDescriptions);

      // Act
      const result = await service.checkRushOrderEligibility(orderId);

      // Assert
      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: { order_id: orderId },
      });
      expect(deliveryInfoRepository.findOne).toHaveBeenCalledWith({
        where: { order_id: orderId },
      });
      expect(orderDescriptionRepository.find).toHaveBeenCalledWith({
        where: { order_id: orderId },
        relations: ['product'],
      });
      expect(result).toEqual({
        eligible: true,
        message: '1 out of 2 products are eligible for rush delivery',
        eligibleProducts: [
          {
            product_id: 1,
            quantity: 2,
          },
        ],
      });
    });

    it('should return not eligible when order is not in Hanoi', async () => {
      // Arrange
      const orderId = 3;
      orderRepository.findOne.mockResolvedValue(mockOrder);
      deliveryInfoRepository.findOne.mockResolvedValue(mockDeliveryInfoOther);

      // Act
      const result = await service.checkRushOrderEligibility(orderId);

      // Assert
      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: { order_id: orderId },
      });
      expect(deliveryInfoRepository.findOne).toHaveBeenCalledWith({
        where: { order_id: orderId },
      });
      expect(result).toEqual({
        eligible: false,
        message: 'Rush delivery is not available in your area',
        eligibleProducts: [],
      });
    });

    it('should return not eligible when order is in Hanoi but no products are eligible', async () => {
      // Arrange
      const orderId = 1;
      const mockOrderDescriptions = [mockOrderDescriptionNotEligible];

      orderRepository.findOne.mockResolvedValue(mockOrder);
      deliveryInfoRepository.findOne.mockResolvedValue(mockDeliveryInfoHN);
      orderDescriptionRepository.find.mockResolvedValue(mockOrderDescriptions);

      // Act
      const result = await service.checkRushOrderEligibility(orderId);

      // Assert
      expect(result).toEqual({
        eligible: false,
        message: 'No products are eligible for rush delivery',
        eligibleProducts: [],
      });
    });

    it('should throw NotFoundException when order is not found', async () => {
      // Arrange
      const orderId = 999;
      orderRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.checkRushOrderEligibility(orderId)).rejects.toThrow(
        NotFoundException,
      );

      await expect(
        service.checkRushOrderEligibility(orderId),
      ).rejects.toMatchObject({
        response: {
          code: 'ORDER_NOT_FOUND',
          message: `Order ID ${orderId} not found`,
        },
      });
    });

    it('should throw NotFoundException when delivery info is not found', async () => {
      // Arrange
      const orderId = 1;
      orderRepository.findOne.mockResolvedValue(mockOrder);
      deliveryInfoRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.checkRushOrderEligibility(orderId)).rejects.toThrow(
        NotFoundException,
      );

      await expect(
        service.checkRushOrderEligibility(orderId),
      ).rejects.toMatchObject({
        response: {
          code: 'DELIVERY_INFO_NOT_FOUND',
          message: `Delivery info for order ID ${orderId} not found`,
        },
      });
    });

    it('should handle multiple eligible products correctly', async () => {
      // Arrange
      const orderId = 1;
      const mockProductEligible2: Product = {
        ...mockProductEligible,
        product_id: 3,
        title: 'Another Rush Eligible Book',
      };
      const mockOrderDescriptionEligible2: OrderDescription = {
        order_id: 1,
        product_id: 3,
        quantity: 3,
        is_rush: false,
        order: mockOrder,
        product: mockProductEligible2,
      };
      const mockOrderDescriptions = [
        mockOrderDescriptionEligible,
        mockOrderDescriptionNotEligible,
        mockOrderDescriptionEligible2,
      ];

      orderRepository.findOne.mockResolvedValue(mockOrder);
      deliveryInfoRepository.findOne.mockResolvedValue(mockDeliveryInfoHN);
      orderDescriptionRepository.find.mockResolvedValue(mockOrderDescriptions);

      // Act
      const result = await service.checkRushOrderEligibility(orderId);

      // Assert
      expect(result).toEqual({
        eligible: true,
        message: '2 out of 3 products are eligible for rush delivery',
        eligibleProducts: [
          {
            product_id: 1,
            quantity: 2,
          },
          {
            product_id: 3,
            quantity: 3,
          },
        ],
      });
    });
  });

  describe('calculateRushDeliveryFee', () => {
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

    const mockDeliveryInfoHN: DeliveryInfo = {
      delivery_id: 1,
      recipient_name: 'John Doe',
      email: 'john@example.com',
      phone: '+84123456789',
      order_id: 1,
      province: 'HN',
      address: '123 Hanoi Street',
      instruction: 'Leave at front door',
      delivery_time: new Date(),
      order: mockOrder,
    };

    const mockProductLight: Product = {
      product_id: 1,
      title: 'Light Book',
      value: 29.99,
      quantity: 2,
      current_price: 29.99,
      category: 'book',
      manager_id: 1,
      creation_date: new Date(),
      rush_order_eligibility: true,
      barcode: '123456789',
      description: 'Light book for rush delivery',
      weight: 0.5,
      dimensions: '20x15x2',
      type: 'book',
      warehouse_entrydate: new Date(),
      manager: mockUser,
    };

    const mockProductHeavy: Product = {
      product_id: 2,
      title: 'Heavy Book',
      value: 49.99,
      quantity: 1,
      current_price: 49.99,
      category: 'book',
      manager_id: 1,
      creation_date: new Date(),
      rush_order_eligibility: true,
      barcode: '987654321',
      description: 'Heavy book for rush delivery',
      weight: 2.0,
      dimensions: '25x20x5',
      type: 'book',
      warehouse_entrydate: new Date(),
      manager: mockUser,
    };

    const mockProductVeryHeavy: Product = {
      product_id: 3,
      title: 'Very Heavy Book',
      value: 79.99,
      quantity: 1,
      current_price: 79.99,
      category: 'book',
      manager_id: 1,
      creation_date: new Date(),
      rush_order_eligibility: true,
      barcode: '555666777',
      description: 'Very heavy book for rush delivery',
      weight: 4.0,
      dimensions: '30x25x8',
      type: 'book',
      warehouse_entrydate: new Date(),
      manager: mockUser,
    };

    const mockOrderDescriptionLight: OrderDescription = {
      order_id: 1,
      product_id: 1,
      quantity: 2,
      is_rush: true,
      order: mockOrder,
      product: mockProductLight,
    };

    const mockOrderDescriptionHeavy: OrderDescription = {
      order_id: 1,
      product_id: 2,
      quantity: 1,
      is_rush: true,
      order: mockOrder,
      product: mockProductHeavy,
    };

    const mockOrderDescriptionVeryHeavy: OrderDescription = {
      order_id: 1,
      product_id: 3,
      quantity: 1,
      is_rush: true,
      order: mockOrder,
      product: mockProductVeryHeavy,
    };

    it('should return zero values when no rush items found', async () => {
      // Arrange
      const orderId = 1;
      orderDescriptionRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.calculateRushDeliveryFee(orderId);

      // Assert
      expect(orderDescriptionRepository.find).toHaveBeenCalledWith({
        where: { order_id: orderId, is_rush: true },
        relations: ['product'],
      });
      expect(result).toEqual({
        rushSubtotal: 0,
        rushDeliveryFee: 0,
      });
    });

    it('should calculate delivery fee for Hanoi with light items (no weight surcharge)', async () => {
      // Arrange
      const orderId = 1;
      const mockOrderDescriptions = [mockOrderDescriptionLight];
      // Total weight: 0.5 * 2 = 1kg (below 3kg threshold)
      // Base fee: 22000
      // Items fee: 1 * 10000 = 10000
      // Total: 22000 + 10000 = 32000

      orderDescriptionRepository.find.mockResolvedValue(mockOrderDescriptions);
      deliveryInfoRepository.findOne.mockResolvedValue(mockDeliveryInfoHN);

      // Act
      const result = await service.calculateRushDeliveryFee(orderId);

      // Assert
      expect(orderDescriptionRepository.find).toHaveBeenCalledWith({
        where: { order_id: orderId, is_rush: true },
        relations: ['product'],
      });
      expect(deliveryInfoRepository.findOne).toHaveBeenCalledWith({
        where: { order_id: orderId },
      });
      expect(result).toEqual({
        rushSubtotal: 59.98, // 29.99 * 2
        rushDeliveryFee: 32000,
      });
    });

    it('should calculate delivery fee for Hanoi with heavy items (with weight surcharge)', async () => {
      // Arrange
      const orderId = 1;
      const mockOrderDescriptions = [mockOrderDescriptionVeryHeavy];
      // Total weight: 4.0 * 1 = 4kg (above 3kg threshold)
      // Base fee: 22000
      // Weight surcharge: ((4 - 3) / 0.5) * 2500 = 2 * 2500 = 5000
      // Items fee: 1 * 10000 = 10000
      // Total: 22000 + 5000 + 10000 = 37000

      orderDescriptionRepository.find.mockResolvedValue(mockOrderDescriptions);
      deliveryInfoRepository.findOne.mockResolvedValue(mockDeliveryInfoHN);

      // Act
      const result = await service.calculateRushDeliveryFee(orderId);

      // Assert
      expect(result).toEqual({
        rushSubtotal: 79.99, // 79.99 * 1
        rushDeliveryFee: 37000,
      });
    });

    it('should calculate delivery fee for multiple items with different weights', async () => {
      // Arrange
      const orderId = 1;
      const mockOrderDescriptions = [
        mockOrderDescriptionLight,
        mockOrderDescriptionHeavy,
      ];
      // Light item: 0.5 * 2 = 1kg
      // Heavy item: 2.0 * 1 = 2kg
      // Max weight: 2kg (below 3kg threshold)
      // Base fee: 22000
      // No weight surcharge
      // Items fee: 2 * 10000 = 20000
      // Total: 22000 + 20000 = 42000

      orderDescriptionRepository.find.mockResolvedValue(mockOrderDescriptions);
      deliveryInfoRepository.findOne.mockResolvedValue(mockDeliveryInfoHN);

      // Act
      const result = await service.calculateRushDeliveryFee(orderId);

      // Assert
      expect(result).toEqual({
        rushSubtotal: 109.97, // (29.99 * 2) + (49.99 * 1)
        rushDeliveryFee: 42000,
      });
    });

    it('should calculate delivery fee for multiple items with very heavy weight', async () => {
      // Arrange
      const orderId = 1;
      const mockOrderDescriptions = [
        mockOrderDescriptionLight,
        mockOrderDescriptionVeryHeavy,
      ];
      // Light item: 0.5 * 2 = 1kg
      // Very heavy item: 4.0 * 1 = 4kg
      // Max weight: 4kg (above 3kg threshold)
      // Base fee: 22000
      // Weight surcharge: ((4 - 3) / 0.5) * 2500 = 2 * 2500 = 5000
      // Items fee: 2 * 10000 = 20000
      // Total: 22000 + 5000 + 20000 = 47000

      orderDescriptionRepository.find.mockResolvedValue(mockOrderDescriptions);
      deliveryInfoRepository.findOne.mockResolvedValue(mockDeliveryInfoHN);

      // Act
      const result = await service.calculateRushDeliveryFee(orderId);

      // Assert
      expect(result).toEqual({
        rushSubtotal: 139.97, // (29.99 * 2) + (79.99 * 1)
        rushDeliveryFee: 47000,
      });
    });

    it('should throw NotFoundException when delivery info is not found', async () => {
      // Arrange
      const orderId = 1;
      const mockOrderDescriptions = [mockOrderDescriptionLight];

      orderDescriptionRepository.find.mockResolvedValue(mockOrderDescriptions);
      deliveryInfoRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.calculateRushDeliveryFee(orderId)).rejects.toThrow(
        NotFoundException,
      );

      await expect(
        service.calculateRushDeliveryFee(orderId),
      ).rejects.toMatchObject({
        response: {
          code: 'DELIVERY_INFO_NOT_FOUND',
          message: 'Need delivery info to calculate delivery fee',
        },
      });
    });

    it('should throw BadRequestException when province is not Hanoi', async () => {
      // Arrange
      const orderId = 1;
      const mockOrderDescriptions = [mockOrderDescriptionLight];
      const mockDeliveryInfoHCM: DeliveryInfo = {
        delivery_id: 2,
        recipient_name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+84987654321',
        order_id: 1,
        province: 'HCM',
        address: '456 Ho Chi Minh Street',
        instruction: 'Call before delivery',
        delivery_time: new Date(),
        order: mockOrder,
      };

      orderDescriptionRepository.find.mockResolvedValue(mockOrderDescriptions);
      deliveryInfoRepository.findOne.mockResolvedValue(mockDeliveryInfoHCM);

      // Act & Assert
      await expect(service.calculateRushDeliveryFee(orderId)).rejects.toThrow(
        BadRequestException,
      );

      await expect(
        service.calculateRushDeliveryFee(orderId),
      ).rejects.toMatchObject({
        response: {
          code: 'RUSH_DELIVERY_NOT_AVAILABLE',
          message:
            'Rush delivery is only available in Hanoi (HN). Current province: HCM',
        },
      });
    });

    it('should handle edge case with exact weight threshold for Hanoi', async () => {
      // Arrange
      const orderId = 1;
      const mockProductExactWeight: Product = {
        ...mockProductLight,
        weight: 3.0,
      };
      const mockOrderDescriptionExactWeight: OrderDescription = {
        ...mockOrderDescriptionLight,
        product: mockProductExactWeight,
      };
      const mockOrderDescriptions = [mockOrderDescriptionExactWeight];
      // Total weight: 3.0 * 2 = 6kg (above 3kg threshold)
      // Base fee: 22000
      // Weight surcharge: ((6 - 3) / 0.5) * 2500 = 6 * 2500 = 15000
      // Items fee: 1 * 10000 = 10000
      // Total: 22000 + 15000 + 10000 = 47000

      orderDescriptionRepository.find.mockResolvedValue(mockOrderDescriptions);
      deliveryInfoRepository.findOne.mockResolvedValue(mockDeliveryInfoHN);

      // Act
      const result = await service.calculateRushDeliveryFee(orderId);

      // Assert
      expect(result).toEqual({
        rushSubtotal: 59.98, // 29.99 * 2
        rushDeliveryFee: 47000,
      });
    });
  });
});
