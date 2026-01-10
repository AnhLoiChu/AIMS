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


});
