import { IsArray, IsNumber, ArrayMaxSize, ArrayMinSize } from 'class-validator';

export class DeleteProductsDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Phải có ít nhất 1 sản phẩm để xóa' })
  @ArrayMaxSize(10, { message: 'Chỉ được xóa tối đa 10 sản phẩm cùng lúc' })
  @IsNumber({}, { each: true })
  productIds: number[];
} 