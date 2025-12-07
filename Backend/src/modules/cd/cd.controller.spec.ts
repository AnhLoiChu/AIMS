import { Test, TestingModule } from '@nestjs/testing';
import { CdController } from './cd.controller';
import { CdService } from './cd.service';

describe('CdController', () => {
  let controller: CdController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CdController],
      providers: [CdService],
    }).compile();

    controller = module.get<CdController>(CdController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
