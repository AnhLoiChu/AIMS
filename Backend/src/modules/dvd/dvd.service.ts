import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DVD } from './entities/dvd.entity';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { UpdateDvdDto } from './dto/update-dvd.dto';
import { Product } from '../product/entities/product.entity';
import { ProductInCart } from '../product-in-cart/entities/product-in-cart.entity';
import { OrderDescription } from '../order-description/entities/order-description.entity';
import { EditHistory } from '../edit-history/entities/edit-history.entity';

@Injectable()
export class DvdService extends TypeOrmCrudService<DVD> {
  constructor(
    @InjectRepository(DVD)
    private readonly dvdRepository: Repository<DVD>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductInCart)
    private readonly productInCartRepository: Repository<ProductInCart>,
    @InjectRepository(OrderDescription)
    private readonly orderDescriptionRepository: Repository<OrderDescription>,
    @InjectRepository(EditHistory)
    private readonly editHistoryRepository: Repository<EditHistory>,
  ) {
    super(dvdRepository);
  }

  async create(data: Partial<DVD>): Promise<DVD> {
    const dvd = this.dvdRepository.create(data);
    return this.dvdRepository.save(dvd);
  }

  async update(id: number, updateDvdDto: UpdateDvdDto): Promise<DVD> {
    if (Object.keys(updateDvdDto).length > 0) {
      await this.dvdRepository.update({ dvd_id: id }, updateDvdDto);
    }
    const dvd = await this.dvdRepository.findOne({ where: { dvd_id: id } });
    if (!dvd) {
      throw new Error(`DVD with id ${id} not found`);
    }
    return dvd;
  }

  async delete(id: number): Promise<void> {
    const result = await this.dvdRepository.delete({ dvd_id: id });
    if (result.affected === 0) {
      throw new Error(`DVD with id ${id} not found`);
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

      // 4. Delete from DVD (subtype)
      const dvdResult = await this.dvdRepository.delete({
        dvd_id: productId,
      });
      if (dvdResult.affected && dvdResult.affected > 0) {
        deletedTables.push(`DVD (${dvdResult.affected} records)`);
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
