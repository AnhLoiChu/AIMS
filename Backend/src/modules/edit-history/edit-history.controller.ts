import { Controller } from '@nestjs/common';
import { EditHistoryService } from './edit-history.service';

@Controller('edit-history')
export class EditHistoryController {
  constructor(private readonly editHistoryService: EditHistoryService) {}
}
