import { Test, TestingModule } from '@nestjs/testing';
import { LpController } from './lp.controller';
import { LpService } from './lp.service';

describe('LpController', () => {
  let controller: LpController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LpController],
      providers: [LpService],
    }).compile();

    controller = module.get<LpController>(LpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
