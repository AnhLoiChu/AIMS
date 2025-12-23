import { IsEnum, IsString, IsNumber } from 'class-validator';
import { EditAction } from '../entities/edit-history.entity';

export class CreateEditHistoryDto {
  @IsNumber()
  product_id: number;

  @IsEnum(EditAction)
  action: EditAction;

  @IsString()
  change_description: string;
}
