import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';
import { UpdateProductDto } from '../../product/dto/update-product.dto';

export class UpdateBookDto extends UpdateProductDto {
  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  cover_type?: string;

  @IsOptional()
  @IsString()
  publisher?: string;

  @IsOptional()
  @IsDate()
  publication_date?: Date;

  @IsOptional()
  @IsNumber()
  number_of_pages?: number;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  genre?: string;
}
