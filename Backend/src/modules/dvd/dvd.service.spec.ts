import { Test, TestingModule } from '@nestjs/testing';
import { DvdService } from './dvd.service';

describe('DvdService', () => {
  let service: DvdService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DvdService],
    }).compile();

    service = module.get<DvdService>(DvdService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
