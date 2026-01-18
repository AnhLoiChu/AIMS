import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { CartService } from '../cart/cart.service';
import { OrderDescriptionService } from '../order-description/order-description.service';
import { Order } from './entities/order.entity';

describe('OrderController', () => {
  let controller: OrderController;
  let orderService: OrderService;
  let cartService: CartService;
  let orderDescriptionService: OrderDescriptionService;
  let orderRepository: Repository<Order>;

  const mockOrderService = {
    findOne: jest.fn(),
    createOrder: jest.fn(),
    removeOrder: jest.fn(),
    checkProductAvailability: jest.fn(),
    calculateNormalDeliveryFee: jest.fn(),
    approveOrRejectOrder: jest.fn(),
    updateOrderStatus: jest.fn(),
    getPendingOrders: jest.fn(),
    getOrdersByUserId: jest.fn(),
    cancelOrder: jest.fn(),
  };

  const mockCartService = {
    findOne: jest.fn(),
  };

  const mockOrderDescriptionService = {
    createOrderDescription: jest.fn(),
    deleteProductInOrder: jest.fn(),
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
});
