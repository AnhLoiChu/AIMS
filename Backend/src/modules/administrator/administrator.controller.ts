import { Body, Controller } from '@nestjs/common';
import { AdministratorService } from './administrator.service';

@Controller('administrator')
export class AdministratorController {
  constructor(public readonly service: AdministratorService) {}
}
