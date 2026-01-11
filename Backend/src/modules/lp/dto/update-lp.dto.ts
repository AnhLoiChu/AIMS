import { IsString, IsDate, IsOptional } from 'class-validator';
import { UpdateProductDto } from '../../product/dto/update-product.dto';

export class UpdateLpDto extends UpdateProductDto {
  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsString()
  artist?: string;

  @IsOptional()
  @IsString()
  record_label?: string;

  @IsOptional()
  @IsString()
  tracklist?: string;

  @IsOptional()
  @IsDate()
  release_date?: Date;
}
