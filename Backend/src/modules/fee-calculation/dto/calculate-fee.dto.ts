import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class ProductDto {
  @IsNumber()
  weight: number;

  @IsString()
  dimensions: string;

  @IsNumber()
  value: number;
}

class ItemDto {
  @Type(() => ProductDto)
  product: ProductDto;

  @IsNumber()
  quantity: number;
}

export class CalculateFeeDto {
  @IsArray()
  @Type(() => ItemDto)
  items: ItemDto[];

  @IsString()
  province: string;

  @IsNumber()
  subtotal: number;

  @IsOptional()
  @IsString()
  strategyName?: string;
}
