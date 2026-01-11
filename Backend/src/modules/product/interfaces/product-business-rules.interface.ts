import { Product } from '../entities/product.entity';

export interface IProductBusinessRules {
  checkEditLimits(productId: number, managerId: number): Promise<void>;
  checkDeleteLimits(products: Product[]): Promise<void>;
  validatePriceRange(currentPrice: number, productValue: number): void;
} 