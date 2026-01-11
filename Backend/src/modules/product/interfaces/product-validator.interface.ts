import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateFullProductDto } from '../dto/update-full-product.dto';

export interface IProductValidator {
  validateCreate(dto: CreateProductDto): Promise<void>;
  validateUpdate(id: number, dto: UpdateFullProductDto): Promise<void>;
  validateDelete(productIds: number[]): Promise<void>;
} 