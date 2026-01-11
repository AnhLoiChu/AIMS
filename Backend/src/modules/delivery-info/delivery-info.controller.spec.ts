import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryInfoController } from './delivery-info.controller';
import { DeliveryInfoService } from './delivery-info.service';

describe('DeliveryInfoController', () => {
  let controller: DeliveryInfoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeliveryInfoController],
      providers: [DeliveryInfoService],
    }).compile();

    controller = module.get<DeliveryInfoController>(DeliveryInfoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
