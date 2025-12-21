import { Test, TestingModule } from '@nestjs/testing';
import { PayOrderController } from './payment-transaction.controller';
import { PaymentTransactionService } from './payment-transaction.service';

describe('PayOrderController', () => {
  let controller: PayOrderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayOrderController],
      providers: [PaymentTransactionService],
    }).compile();

    controller = module.get<PayOrderController>(PayOrderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
