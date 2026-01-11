import { IsString, IsNumber, IsDate } from 'class-validator';
import {
  BaseProductDto,
  ProductType,
} from '../../product/dto/base-product.dto';

export class CreateBookDto extends BaseProductDto {
  type: ProductType.BOOK = ProductType.BOOK;

  @IsString()
  author: string;

  @IsString()
  cover_type: string;

  @IsString()
  publisher: string;

  @IsDate()
  publication_date: Date;

  @IsNumber()
  number_of_pages: number;

  @IsString()
  language: string;

  @IsString()
  genre: string;
}
