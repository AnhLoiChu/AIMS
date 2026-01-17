import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { CD } from './entities/cd.entity';
import { UpdateCdDto } from './dto/update-cd.dto';
import { Product } from '../product/entities/product.entity';
import { ProductInCart } from '../product-in-cart/entities/product-in-cart.entity';
import { OrderDescription } from '../order-description/entities/order-description.entity';
import { EditHistory } from '../edit-history/entities/edit-history.entity';

@Injectable()
export class CdService extends TypeOrmCrudService<CD> {
  constructor(
    @InjectRepository(CD)
    private readonly cdRepository: Repository<CD>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductInCart)
    private readonly productInCartRepository: Repository<ProductInCart>,
    @InjectRepository(OrderDescription)
    private readonly orderDescriptionRepository: Repository<OrderDescription>,
    @InjectRepository(EditHistory)
    private readonly editHistoryRepository: Repository<EditHistory>,
  ) {
    super(cdRepository);
  }

  async create(data: Partial<CD>): Promise<CD> {
    const cd = this.cdRepository.create(data);
    return this.cdRepository.save(cd);
  }

  async update(id: number, updateCdDto: UpdateCdDto): Promise<CD> {
    if (Object.keys(updateCdDto).length > 0) {
      await this.cdRepository.update({ cd_id: id }, updateCdDto);
    }
    const cd = await this.cdRepository.findOne({ where: { cd_id: id } });
    if (!cd) {
      throw new Error(`CD with id ${id} not found`);
    }
    return cd;
  }

  async delete(id: number): Promise<void> {
    const result = await this.cdRepository.delete({ cd_id: id });
    if (result.affected === 0) {
      throw new Error(`CD with id ${id} not found`);
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

      // 4. Delete from CD (subtype)
      const cdResult = await this.cdRepository.delete({
        cd_id: productId,
      });
      if (cdResult.affected && cdResult.affected > 0) {
        deletedTables.push(`CD (${cdResult.affected} records)`);
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
