import { Test, TestingModule } from '@nestjs/testing';
import { LpService } from './lp.service';

describe('LpService', () => {
  let service: LpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LpService],
    }).compile();

    service = module.get<LpService>(LpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
