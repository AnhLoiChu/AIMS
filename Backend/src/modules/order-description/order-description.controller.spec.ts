import { Test, TestingModule } from '@nestjs/testing';
import { OrderDescriptionController } from './order-description.controller';
import { OrderDescriptionService } from './order-description.service';

describe('OrderDescriptionController', () => {
  let controller: OrderDescriptionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderDescriptionController],
      providers: [OrderDescriptionService],
    }).compile();

    controller = module.get<OrderDescriptionController>(
      OrderDescriptionController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
