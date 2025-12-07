import { Test, TestingModule } from '@nestjs/testing';
import { DvdController } from './dvd.controller';
import { DvdService } from './dvd.service';

describe('DvdController', () => {
  let controller: DvdController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DvdController],
      providers: [DvdService],
    }).compile();

    controller = module.get<DvdController>(DvdController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
