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
import { FeeCalculationService } from '../fee-calculation/fee-calculation.service';
import { MailService } from '../mail/mail.service';

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
  let feeCalculationService: any;
  let mailService: any;

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
      createOrderDescription: jest.fn().mockResolvedValue([]),
      deleteProductInOrder: jest.fn().mockResolvedValue({}),
    };

    deliveryInfoService = {
      create: jest.fn().mockResolvedValue({}),
    };

    feeCalculationService = {
      calculateDeliveryFee: jest.fn().mockResolvedValue(10),
    };

    mailService = {
      sendOrderConfirmation: jest.fn().mockResolvedValue({}),
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
        {
          provide: FeeCalculationService,
          useValue: feeCalculationService,
        },
        {
          provide: MailService,
          useValue: mailService,
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
});
