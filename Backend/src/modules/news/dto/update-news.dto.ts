import { IsString, IsDate, IsOptional } from 'class-validator';
import { UpdateProductDto } from '../../product/dto/update-product.dto';

export class UpdateNewsDto extends UpdateProductDto {
  @IsOptional()
  @IsString()
  editor_in_chief?: string;

  @IsOptional()
  @IsString()
  publisher?: string;

  @IsOptional()
  @IsDate()
  publication_date?: Date;

  @IsOptional()
  @IsString()
  issue_number?: string;

  @IsOptional()
  @IsString()
  publication_frequency?: string;

  @IsOptional()
  @IsString()
  issn?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  sections?: string;
}
