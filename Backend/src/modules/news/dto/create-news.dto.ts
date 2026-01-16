import { IsString, IsDate, IsOptional } from 'class-validator';
import {
  BaseProductDto,
  ProductType,
} from '../../product/dto/base-product.dto';

export class CreateNewsDto extends BaseProductDto {
  type: ProductType.NEWS = ProductType.NEWS;

  // Editor in Chief
  @IsString()
  editor_in_chief: string;

  // Publisher
  @IsString()
  publisher: string;

  // Publication Date
  @IsDate()
  publication_date: Date;

  // Issue Number
  @IsString()
  issue_number: string;

  // Publication Frequency
  @IsString()
  publication_frequency: string;

  // ISSN Code
  @IsOptional()
  @IsString()
  issn?: string;

  // Language
  @IsString()
  language: string;

  // Sections
  @IsString()
  sections: string;
}
