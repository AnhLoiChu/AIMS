import { Test, TestingModule } from '@nestjs/testing';
import { PaymentTransactionService } from './payment-transaction.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { Order } from '../order/entities/order.entity';
import { DeliveryInfo } from '../delivery-info/entities/delivery-info.entity';
import { User } from '../user/entities/user.entity';
import { NotFoundException } from '@nestjs/common';
import { CreatePaymentTransactionDto } from './dto/create-payment-transaction.dto';
import { OrderStatus } from '../order/dto/order-status.enum';
const mockRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

describe('PaymentTransactionService', () => {
  let service: PaymentTransactionService;
  let paymentTransactionRepo, orderRepo, deliveryInfoRepo, userRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentTransactionService,
        {
          provide: getRepositoryToken(PaymentTransaction),
          useFactory: mockRepo,
        },
        { provide: getRepositoryToken(Order), useFactory: mockRepo },
        { provide: getRepositoryToken(DeliveryInfo), useFactory: mockRepo },
        { provide: getRepositoryToken(User), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<PaymentTransactionService>(PaymentTransactionService);
    paymentTransactionRepo = module.get(getRepositoryToken(PaymentTransaction));
    orderRepo = module.get(getRepositoryToken(Order));
    deliveryInfoRepo = module.get(getRepositoryToken(DeliveryInfo));
    userRepo = module.get(getRepositoryToken(User));
  });

  describe('createTransaction', () => {
    const mockOrder = { order_id: 1, subtotal: 100000 };
    const mockPaymentData: CreatePaymentTransactionDto = {
      order_id: 1,
      orderDescription: 'Test order payment',
      orderType: 'NORMAL',
      bankCode: 'VCB',
    };

    // TC001: Should create transaction when order exists and no pending transaction
    it('should create transaction when order exists and no pending transaction', async () => {
      orderRepo.findOne.mockResolvedValue(mockOrder);
      paymentTransactionRepo.findOne.mockResolvedValue(null);
      paymentTransactionRepo.create.mockReturnValue({
        method: 'VNPAY',
        content: mockPaymentData.orderDescription,
        status: 'PENDING',
        order_id: mockPaymentData.order_id,
        bank_name: mockPaymentData.bankCode,
      });
      paymentTransactionRepo.save.mockResolvedValue({
        payment_transaction_id: 'uuid-123',
        method: 'VNPAY',
        status: 'PENDING',
        order_id: 1,
      });

      const result = await service.createTransaction(mockPaymentData);

      expect(result.transaction).toBeDefined();
      expect(result.order).toBeDefined();
      expect(paymentTransactionRepo.create).toHaveBeenCalledWith({
        method: 'VNPAY',
        content: mockPaymentData.orderDescription,
        status: 'PENDING',
        order_id: mockPaymentData.order_id,
        bank_name: mockPaymentData.bankCode,
      });
    });

    // TC002: Should throw NotFoundException when order does not exist
    it('should throw NotFoundException when order does not exist', async () => {
      orderRepo.findOne.mockResolvedValue(null);

      await expect(service.createTransaction(mockPaymentData)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createTransaction(mockPaymentData)).rejects.toThrow(
        `Order with ID ${mockPaymentData.order_id} not found`,
      );
    });

    // TC003: Should throw Error when pending transaction already exists
    it('should throw Error when pending transaction already exists', async () => {
      orderRepo.findOne.mockResolvedValue(mockOrder);
      paymentTransactionRepo.findOne.mockResolvedValue({
        order_id: 1,
        status: 'PENDING',
      });

      await expect(service.createTransaction(mockPaymentData)).rejects.toThrow(
        Error,
      );
      await expect(service.createTransaction(mockPaymentData)).rejects.toThrow(
        `Order ${mockPaymentData.order_id} has a pending payment. Please complete or cancel the existing payment first.`,
      );
    });
  });

  describe('updateTransactionStatus', () => {
    const mockTransaction = {
      order_id: 1,
      status: 'PENDING',
      save: jest.fn(),
    };

    // TC004: Should update transaction status to SUCCESS and update order status
    it('should update transaction status to SUCCESS and update order status', async () => {
      const updatedTransaction = { ...mockTransaction, status: 'SUCCESS' };
      paymentTransactionRepo.findOne.mockResolvedValue(mockTransaction);
      orderRepo.update.mockResolvedValue({});
      paymentTransactionRepo.save.mockResolvedValue(updatedTransaction);

      const result = await service.updateTransactionStatus(1, 'SUCCESS');

      expect(result.status).toBe('SUCCESS');
      expect(orderRepo.update).toHaveBeenCalledWith(
        { order_id: 1 },
        { status: OrderStatus.PENDING },
      );
    });

    // TC005: Should throw NotFoundException when transaction not found
    it('should throw NotFoundException when transaction not found', async () => {
      paymentTransactionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateTransactionStatus(1, 'SUCCESS'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateTransactionStatus(1, 'SUCCESS'),
      ).rejects.toThrow(`Transaction with order ID 1 not found`);
    });

    // TC006: Should not update order status when transaction status is not SUCCESS
    it('should not update order status when transaction status is not SUCCESS', async () => {
      const updatedTransaction = { ...mockTransaction, status: 'FAILED' };
      paymentTransactionRepo.findOne.mockResolvedValue(mockTransaction);
      paymentTransactionRepo.save.mockResolvedValue(updatedTransaction);

      const result = await service.updateTransactionStatus(1, 'FAILED');

      expect(result.status).toBe('FAILED');
      expect(orderRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('getOrderDetailsForEmail', () => {
    const mockOrder = {
      order_id: 1,
      cart: { cart_id: 1 },
      subtotal: 100000,
    };

    const mockDeliveryInfo = {
      delivery_id: 1,
      email: 'test@example.com',
      recipient_name: 'Test User',
      phone: '0123456789',
      address: '123 Test Street',
      province: 'Ho Chi Minh',
      order_id: 1,
    };

    const mockTransaction = {
      payment_transaction_id: 'uuid-123',
      status: 'SUCCESS',
      method: 'VNPAY',
    };

    // TC007: Should return order, deliveryInfo, and transaction details
    it('should return order, deliveryInfo, and transaction details', async () => {
      orderRepo.findOne.mockResolvedValue(mockOrder);
      deliveryInfoRepo.findOne.mockResolvedValue(mockDeliveryInfo);
      paymentTransactionRepo.findOne.mockResolvedValue(mockTransaction);

      const result = await service.getOrderDetailsForEmail(1);

      expect(result.order).toEqual(mockOrder);
      expect(result.deliveryInfo).toEqual(mockDeliveryInfo);
      expect(result.transaction).toEqual(mockTransaction);
      expect(result.deliveryInfo.email).toBe('test@example.com');
    });

    // TC008: Should throw NotFoundException when order not found
    it('should throw NotFoundException when order not found', async () => {
      orderRepo.findOne.mockResolvedValue(null);

      await expect(service.getOrderDetailsForEmail(1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getOrderDetailsForEmail(1)).rejects.toThrow(
        `Order with ID 1 not found`,
      );
    });

    // TC009: Should throw NotFoundException when deliveryInfo not found
    it('should throw NotFoundException when deliveryInfo not found', async () => {
      orderRepo.findOne.mockResolvedValue(mockOrder);
      deliveryInfoRepo.findOne.mockResolvedValue(null);

      await expect(service.getOrderDetailsForEmail(1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getOrderDetailsForEmail(1)).rejects.toThrow(
        `Delivery info for order ID 1 not found`,
      );
    });

    // TC010: Should throw NotFoundException when transaction not found
    it('should throw NotFoundException when transaction not found', async () => {
      orderRepo.findOne.mockResolvedValue(mockOrder);
      deliveryInfoRepo.findOne.mockResolvedValue(mockDeliveryInfo);
      paymentTransactionRepo.findOne.mockResolvedValue(null);

      await expect(service.getOrderDetailsForEmail(1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getOrderDetailsForEmail(1)).rejects.toThrow(
        `Successful transaction for order ID 1 not found`,
      );
    });
  });
});
