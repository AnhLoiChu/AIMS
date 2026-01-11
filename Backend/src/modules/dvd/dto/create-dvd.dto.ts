import { IsString, IsDate } from 'class-validator';
import {
  BaseProductDto,
  ProductType,
} from '../../product/dto/base-product.dto';

/**
 * Data Transfer Object for creating a new DVD.
 */
export class CreateDvdDto extends BaseProductDto {
  type: ProductType.DVD = ProductType.DVD;

  @IsString()
  language: string;

  @IsString()
  subtitles: string;

  @IsString()
  runtime: string;

  @IsString()
  disc_type: string;

  @IsDate()
  release_date: Date;

  @IsString()
  studio: string;

  @IsString()
  director: string;

  @IsString()
  genre: string;
}
