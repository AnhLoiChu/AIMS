import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { LP } from './entities/lp.entity';
import { UpdateLpDto } from './dto/update-lp.dto';
import { Product } from '../product/entities/product.entity';
import { ProductInCart } from '../product-in-cart/entities/product-in-cart.entity';
import { OrderDescription } from '../order-description/entities/order-description.entity';
import { EditHistory } from '../edit-history/entities/edit-history.entity';

@Injectable()
export class LpService extends TypeOrmCrudService<LP> {
  constructor(
    @InjectRepository(LP)
    private readonly lpRepository: Repository<LP>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductInCart)
    private readonly productInCartRepository: Repository<ProductInCart>,
    @InjectRepository(OrderDescription)
    private readonly orderDescriptionRepository: Repository<OrderDescription>,
    @InjectRepository(EditHistory)
    private readonly editHistoryRepository: Repository<EditHistory>,
  ) {
    super(lpRepository);
  }

  async create(data: Partial<LP>): Promise<LP> {
    const lp = this.lpRepository.create(data);
    return this.lpRepository.save(lp);
  }

  async update(id: number, updateLpDto: UpdateLpDto): Promise<LP> {
    await this.lpRepository.update({ lp_id: id }, updateLpDto);
    const lp = await this.lpRepository.findOne({ where: { lp_id: id } });
    if (!lp) {
      throw new Error(`LP with id ${id} not found`);
    }
    return lp;
  }

  async delete(id: number): Promise<void> {
    const result = await this.lpRepository.delete({ lp_id: id });
    if (result.affected === 0) {
      throw new Error(`LP with id ${id} not found`);
    }
  }

  async deleteCascade(productId: number): Promise<{
    success: boolean;
    deletedTables: string[];
    message: string;
  }> {
    const deletedTables: string[] = [];

    try {
      // 1. Delete from ProductInCart (products in shopping carts)
      const productInCartResult = await this.productInCartRepository.delete({
        product_id: productId,
      });
      if (productInCartResult.affected && productInCartResult.affected > 0) {
        deletedTables.push(
          `ProductInCart (${productInCartResult.affected} records)`,
        );
      }

      // 2. Delete from OrderDescription (products in orders)
      const orderDescriptionResult =
        await this.orderDescriptionRepository.delete({
          product_id: productId,
        });
      if (
        orderDescriptionResult.affected &&
        orderDescriptionResult.affected > 0
      ) {
        deletedTables.push(
          `OrderDescription (${orderDescriptionResult.affected} records)`,
        );
      }

      // 3. Delete from EditHistory (edit history records)
      const editHistoryResult = await this.editHistoryRepository.delete({
        product_id: productId,
      });
      if (editHistoryResult.affected && editHistoryResult.affected > 0) {
        deletedTables.push(
          `EditHistory (${editHistoryResult.affected} records)`,
        );
      }

      // 4. Delete from LP (subtype)
      const lpResult = await this.lpRepository.delete({
        lp_id: productId,
      });
      if (lpResult.affected && lpResult.affected > 0) {
        deletedTables.push(`LP (${lpResult.affected} records)`);
      }

      // 5. Delete from Product (main table)
      const productResult = await this.productRepository.delete({
        product_id: productId,
      });
      if (productResult.affected && productResult.affected > 0) {
        deletedTables.push(`Product (${productResult.affected} records)`);
      }

      return {
        success: true,
        deletedTables,
        message: `Successfully deleted product ${productId} and all related records from: ${deletedTables.join(', ')}`,
      };
    } catch (error) {
      throw new Error(
        `Failed to delete cascade for product ${productId}: ${error.message}`,
      );
    }
  }
}
