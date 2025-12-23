import { Test, TestingModule } from '@nestjs/testing';
import { EditHistoryService } from './edit-history.service';

describe('EditHistoryService', () => {
  let service: EditHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EditHistoryService],
    }).compile();

    service = module.get<EditHistoryService>(EditHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
