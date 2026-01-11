import { PartialType } from '@nestjs/mapped-types';
import { CreateEditHistoryDto } from './create-edit-history.dto';

export class UpdateEditHistoryDto extends PartialType(CreateEditHistoryDto) {}
