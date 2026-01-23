import { IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateProductDto {
  title?: string;
  value?: number;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Số lượng sản phẩm phải lớn hơn 0' })
  quantity?: number;

  current_price?: number;
  category?: string;
  creation_date?: Date;


  barcode?: string;
  description?: string;
  weight?: number;
  dimensions?: string;
  type?: string;
  warehouse_entrydate?: Date;
}
