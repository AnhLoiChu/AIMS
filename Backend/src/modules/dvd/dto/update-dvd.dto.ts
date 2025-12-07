import { IsString, IsDate, IsOptional } from 'class-validator';
import { UpdateProductDto } from '../../product/dto/update-product.dto';

export class UpdateDvdDto extends UpdateProductDto {
  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  subtitles?: string;

  @IsOptional()
  @IsString()
  runtime?: string;

  @IsOptional()
  @IsString()
  disc_type?: string;

  @IsOptional()
  @IsDate()
  release_date?: Date;

  @IsOptional()
  @IsString()
  studio?: string;

  @IsOptional()
  @IsString()
  director?: string;

  @IsOptional()
  @IsString()
  genre?: string;
}
