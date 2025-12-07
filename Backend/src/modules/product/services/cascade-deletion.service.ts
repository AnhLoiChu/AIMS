import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { ProductInCart } from '../../product-in-cart/entities/product-in-cart.entity';
import { OrderDescription } from '../../order-description/entities/order-description.entity';
import { EditHistory } from '../../edit-history/entities/edit-history.entity';
import { UserService } from '../../user/user.service';

// Forward declaration to avoid circular dependency
export interface IProductSubtypeFactory {
  getService(type: any): any;
}

@Injectable()
export class CascadeDeletionService {
  constructor(
    @InjectRepository(ProductInCart)
    private readonly productInCartRepo: Repository<ProductInCart>,
    @InjectRepository(OrderDescription)
    private readonly orderDescriptionRepo: Repository<OrderDescription>,
    @InjectRepository(EditHistory)
    private readonly editHistoryRepo: Repository<EditHistory>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly userService: UserService,
  ) {}

  async deleteProducts(
    products: Product[],
    subtypeFactory: IProductSubtypeFactory
  ) {
    const deletedProducts: Array<{
      id: number;
      title: string;
      type: string;
      cascadeDetails: string[];
    }> = [];
    const errors: Array<{
      id: number;
      title: string;
      error: string;
    }> = [];

    for (const product of products) {
      try {
        // Delete subtype first
        const subtypeService = subtypeFactory.getService(product.type);
        await subtypeService.delete(product.product_id);

        // Delete related records
        const cascadeResult = await this.deleteCascadeRelatedRecords(product.product_id);

        // Increment manager delete count
        await this.userService.incrementDeleteCount(product.manager_id);

        deletedProducts.push({
          id: product.product_id,
          title: product.title,
          type: product.type,
          cascadeDetails: cascadeResult.deletedTables
        });
      } catch (error: any) {
        errors.push({
          id: product.product_id,
          title: product.title,
          error: error.message,
        });
      }
    }

    return {
      success: deletedProducts.length > 0,
      deletedCount: deletedProducts.length,
      errorCount: errors.length,
      deletedProducts,
      errors: errors.length > 0 ? errors : undefined,
      message: `Đã xóa thành công ${deletedProducts.length}/${products.length} sản phẩm`,
    };
  }

  private async deleteCascadeRelatedRecords(productId: number): Promise<{
    deletedTables: string[];
  }> {
    const deletedTables: string[] = [];

    try {
      // 1. Delete from ProductInCart (products in shopping carts)
      const productInCartResult = await this.productInCartRepo.delete({ 
        product_id: productId 
      });
      if (productInCartResult.affected && productInCartResult.affected > 0) {
        deletedTables.push(`ProductInCart (${productInCartResult.affected} records)`);
      }

      // 2. Delete from OrderDescription (products in orders)
      const orderDescriptionResult = await this.orderDescriptionRepo.delete({ 
        product_id: productId 
      });
      if (orderDescriptionResult.affected && orderDescriptionResult.affected > 0) {
        deletedTables.push(`OrderDescription (${orderDescriptionResult.affected} records)`);
      }

      // 3. Delete from EditHistory (edit history records)
      const editHistoryResult = await this.editHistoryRepo.delete({ 
        product_id: productId 
      });
      if (editHistoryResult.affected && editHistoryResult.affected > 0) {
        deletedTables.push(`EditHistory (${editHistoryResult.affected} records)`);
      }

      // 4. Finally delete from Product (main table)
      const productResult = await this.productRepo.delete({ 
        product_id: productId 
      });
      if (productResult.affected && productResult.affected > 0) {
        deletedTables.push(`Product (${productResult.affected} records)`);
      }

      return { deletedTables };

    } catch (error) {
      throw new Error(`Failed to delete cascade for product ${productId}: ${error.message}`);
    }
  }
} 