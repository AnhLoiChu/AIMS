import { Test, TestingModule } from '@nestjs/testing';
import { CdService } from './cd.service';

describe('CdService', () => {
  let service: CdService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CdService],
    }).compile();

    service = module.get<CdService>(CdService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
