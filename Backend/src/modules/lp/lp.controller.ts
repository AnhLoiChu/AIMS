import { Controller } from '@nestjs/common';
import { LpService } from './lp.service';
import { LP } from './entities/lp.entity';
import { CrudController } from '@dataui/crud';

@Controller('lp')
export class LpController implements CrudController<LP> {
  constructor(public service: LpService) {}
}
