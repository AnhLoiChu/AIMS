import { Test, TestingModule } from '@nestjs/testing';
import { OrderDescriptionService } from './order-description.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderDescription } from './entities/order-description.entity';
import { Order } from '../order/entities/order.entity';
import { ProductInCart } from '../product-in-cart/entities/product-in-cart.entity';
import { Product } from '../product/entities/product.entity';
import { User } from '../user/entities/user.entity';
import { Role, RoleName } from '../role/entities/role.entity';
import { NotFoundException } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { OrderStatus } from '../order/dto/order-status.enum';

// Mock Repository class
class MockRepository extends Repository<any> {
  constructor() {
    super(undefined as any, undefined as any);
  }
  find = jest.fn();
  save = jest.fn();
  findOne = jest.fn();
}

// Mock TypeOrmCrudService to avoid real constructor logic
jest.mock('@dataui/crud-typeorm', () => ({
  TypeOrmCrudService: jest.fn().mockImplementation(() => ({})),
}));

describe('OrderDescriptionService', () => {
  let service: OrderDescriptionService;
  let orderDescriptionRepository: MockRepository;
  let orderRepository: MockRepository;
  let productInCartRepository: MockRepository;

  const mockOrderDescriptionRepository = {
    find: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    manager: {
      connection: {
        isConnected: true,
      },
    },
    connection: {
      isConnected: true,
    },
    target: {},
  };

  const mockOrderRepository = {
    findOne: jest.fn(),
    manager: {
      connection: {
        isConnected: true,
      },
    },
    connection: {
      isConnected: true,
    },
    target: {},
  };

  const mockProductInCartRepository = {
    find: jest.fn(),
    manager: {
      connection: {
        isConnected: true,
      },
    },
    connection: {
      isConnected: true,
    },
    target: {},
  };

  beforeEach(async () => {
    orderDescriptionRepository = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
    } as any;
    orderRepository = {
      findOne: jest.fn().mockResolvedValue(null),
    } as any;
    productInCartRepository = {
      find: jest.fn().mockResolvedValue([]),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderDescriptionService,
        {
          provide: getRepositoryToken(OrderDescription),
          useValue: orderDescriptionRepository,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: orderRepository,
        },
        {
          provide: getRepositoryToken(ProductInCart),
          useValue: productInCartRepository,
        },
      ],
    }).compile();

    service = module.get<OrderDescriptionService>(OrderDescriptionService);
    // Patch the prototype so methods are available
    Object.setPrototypeOf(service, OrderDescriptionService.prototype);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extendRushOrderDescription', () => {
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

    const mockCart = {
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

    const mockProduct: Product = {
      product_id: 101,
      title: 'Test Product',
      value: 29.99,
      quantity: 10,
      current_price: 29.99,
      category: 'book',
      manager_id: 1,
      creation_date: new Date(),
      rush_order_eligibility: true,
      barcode: '123456789',
      description: 'Test product description',
      weight: 0.5,
      dimensions: '20x15x2',
      type: 'book',
      warehouse_entrydate: new Date(),
      manager: mockUser,
    };

    const mockOrderDescription1: OrderDescription = {
      order_id: 1,
      product_id: 101,
      quantity: 2,
      is_rush: false,
      order: mockOrder,
      product: mockProduct,
    };

    const mockOrderDescription2: OrderDescription = {
      order_id: 1,
      product_id: 102,
      quantity: 1,
      is_rush: false,
      order: mockOrder,
      product: { ...mockProduct, product_id: 102 },
    };

    const mockOrderDescription3: OrderDescription = {
      order_id: 1,
      product_id: 103,
      quantity: 3,
      is_rush: true, // Already rush
      order: mockOrder,
      product: { ...mockProduct, product_id: 103 },
    };

    it('should throw NotFoundException if no matching order descriptions are found', async () => {
      // Arrange
      const orderId = 1;
      const eligibleProductIds = [101, 102];
      orderDescriptionRepository.find.mockResolvedValue([]);

      // Act & Assert
      await expect(
        service.extendRushOrderDescription(orderId, eligibleProductIds),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.extendRushOrderDescription(orderId, eligibleProductIds),
      ).rejects.toMatchObject({
        response: {
          code: 'ORDER_DESCRIPTION_NOT_FOUND',
          message: 'No matching order descriptions found for Order 1',
        },
      });

      expect(orderDescriptionRepository.find).toHaveBeenCalledWith({
        where: {
          order_id: orderId,
          product_id: In(eligibleProductIds),
        },
      });
    });

    it('should update is_rush to true and save the order descriptions', async () => {
      // Arrange
      const orderId = 1;
      const eligibleProductIds = [101, 102];
      const mockDescriptions = [mockOrderDescription1, mockOrderDescription2];
      const expectedUpdatedDescriptions = [
        { ...mockOrderDescription1, is_rush: true },
        { ...mockOrderDescription2, is_rush: true },
      ];

      orderDescriptionRepository.find.mockResolvedValue(mockDescriptions);
      orderDescriptionRepository.save.mockResolvedValue(
        expectedUpdatedDescriptions,
      );

      // Act
      const result = await service.extendRushOrderDescription(
        orderId,
        eligibleProductIds,
      );

      // Assert
      expect(orderDescriptionRepository.find).toHaveBeenCalledWith({
        where: {
          order_id: orderId,
          product_id: In(eligibleProductIds),
        },
      });

      expect(orderDescriptionRepository.save).toHaveBeenCalledWith(
        expectedUpdatedDescriptions,
      );

      expect(result).toEqual({
        success: true,
        message: 'Updated 2 product(s) for rush delivery in order 1',
      });
    });

    it('should handle single product update correctly', async () => {
      // Arrange
      const orderId = 1;
      const eligibleProductIds = [101];
      const mockDescriptions = [mockOrderDescription1];
      const expectedUpdatedDescriptions = [
        { ...mockOrderDescription1, is_rush: true },
      ];

      orderDescriptionRepository.find.mockResolvedValue(mockDescriptions);
      orderDescriptionRepository.save.mockResolvedValue(
        expectedUpdatedDescriptions,
      );

      // Act
      const result = await service.extendRushOrderDescription(
        orderId,
        eligibleProductIds,
      );

      // Assert
      expect(orderDescriptionRepository.find).toHaveBeenCalledWith({
        where: {
          order_id: orderId,
          product_id: In(eligibleProductIds),
        },
      });

      expect(orderDescriptionRepository.save).toHaveBeenCalledWith(
        expectedUpdatedDescriptions,
      );

      expect(result).toEqual({
        success: true,
        message: 'Updated 1 product(s) for rush delivery in order 1',
      });
    });

    it('should handle large number of products', async () => {
      // Arrange
      const orderId = 1;
      const eligibleProductIds = Array.from({ length: 50 }, (_, i) => i + 1);
      const mockDescriptions = eligibleProductIds.map((id) => ({
        order_id: orderId,
        product_id: id,
        quantity: 1,
        is_rush: false,
        order: mockOrder,
        product: { ...mockProduct, product_id: id },
      }));
      const expectedUpdatedDescriptions = mockDescriptions.map((desc) => ({
        ...desc,
        is_rush: true,
      }));

      orderDescriptionRepository.find.mockResolvedValue(mockDescriptions);
      orderDescriptionRepository.save.mockResolvedValue(
        expectedUpdatedDescriptions,
      );

      // Act
      const result = await service.extendRushOrderDescription(
        orderId,
        eligibleProductIds,
      );

      // Assert
      expect(orderDescriptionRepository.find).toHaveBeenCalledWith({
        where: {
          order_id: orderId,
          product_id: In(eligibleProductIds),
        },
      });

      expect(orderDescriptionRepository.save).toHaveBeenCalledWith(
        expectedUpdatedDescriptions,
      );

      expect(result).toEqual({
        success: true,
        message: 'Updated 50 product(s) for rush delivery in order 1',
      });
    });

    it('should handle partial product matches', async () => {
      // Arrange
      const orderId = 1;
      const eligibleProductIds = [101, 102, 999];
      const mockDescriptions = [mockOrderDescription1, mockOrderDescription2];
      const expectedUpdatedDescriptions = [
        { ...mockOrderDescription1, is_rush: true },
        { ...mockOrderDescription2, is_rush: true },
      ];

      orderDescriptionRepository.find.mockResolvedValue(mockDescriptions);
      orderDescriptionRepository.save.mockResolvedValue(
        expectedUpdatedDescriptions,
      );

      // Act
      const result = await service.extendRushOrderDescription(
        orderId,
        eligibleProductIds,
      );

      // Assert
      expect(orderDescriptionRepository.find).toHaveBeenCalledWith({
        where: {
          order_id: orderId,
          product_id: In(eligibleProductIds),
        },
      });

      expect(orderDescriptionRepository.save).toHaveBeenCalledWith(
        expectedUpdatedDescriptions,
      );

      expect(result).toEqual({
        success: true,
        message: 'Updated 2 product(s) for rush delivery in order 1',
      });
    });

    it('should preserve other properties when updating is_rush', async () => {
      // Arrange
      const orderId = 1;
      const eligibleProductIds = [101];
      const mockDescriptionWithExtraProps = {
        ...mockOrderDescription1,
        quantity: 5,
      };
      const mockDescriptions = [mockDescriptionWithExtraProps];
      const expectedUpdatedDescriptions = [
        {
          ...mockDescriptionWithExtraProps,
          is_rush: true,
        },
      ];

      orderDescriptionRepository.find.mockResolvedValue(mockDescriptions);
      orderDescriptionRepository.save.mockResolvedValue(
        expectedUpdatedDescriptions,
      );

      // Act
      const result = await service.extendRushOrderDescription(
        orderId,
        eligibleProductIds,
      );

      // Assert
      expect(orderDescriptionRepository.save).toHaveBeenCalledWith(
        expectedUpdatedDescriptions,
      );
      const savedCall = orderDescriptionRepository.save.mock.calls[0][0];
      expect(savedCall[0].quantity).toBe(5);
      expect(savedCall[0].is_rush).toBe(true);
      expect(savedCall[0].order_id).toBe(orderId);
      expect(savedCall[0].product_id).toBe(101);

      expect(result).toEqual({
        success: true,
        message: 'Updated 1 product(s) for rush delivery in order 1',
      });
    });
  });
});
