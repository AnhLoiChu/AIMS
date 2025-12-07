import { IsString, IsDate } from 'class-validator';
import {
  BaseProductDto,
  ProductType,
} from '../../product/dto/base-product.dto';

/**
 * Data Transfer Object for creating a new CD record.
 *
 * @remarks
 * This DTO is used to encapsulate the data required to create a new CD entry in the system.
 */
export class CreateCdDto extends BaseProductDto {
  type: ProductType.CD = ProductType.CD;

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
