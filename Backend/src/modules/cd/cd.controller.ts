import { Controller } from '@nestjs/common';
import { CdService } from './cd.service';
import { CD } from './entities/cd.entity';
import { CrudController } from '@dataui/crud';

@Controller('cd')
export class CdController implements CrudController<CD> {
  constructor(public service: CdService) {}
}
