import { IsString, IsDate } from 'class-validator';
import {
  BaseProductDto,
  ProductType,
} from '../../product/dto/base-product.dto';

export class CreateLpDto extends BaseProductDto {
  type: ProductType.LP = ProductType.LP;

  @IsString()
  genre: string;

  @IsString()
  artist: string;

  @IsString()
  record_label: string;

  @IsString()
  tracklist: string;

  @IsDate()
  release_date: Date;
}
