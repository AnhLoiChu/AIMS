import { Test, TestingModule } from '@nestjs/testing';
import { EditHistoryController } from './edit-history.controller';
import { EditHistoryService } from './edit-history.service';

describe('EditHistoryController', () => {
  let controller: EditHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EditHistoryController],
      providers: [EditHistoryService],
    }).compile();

    controller = module.get<EditHistoryController>(EditHistoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
