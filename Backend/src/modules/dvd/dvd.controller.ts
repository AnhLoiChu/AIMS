import { Controller, Delete, Param } from '@nestjs/common';
import { DvdService } from './dvd.service';
import { CrudController } from '@dataui/crud';
import { DVD } from './entities/dvd.entity';

@Controller('dvd')
export class DvdController implements CrudController<DVD> {
  constructor(public service: DvdService) {}
}
