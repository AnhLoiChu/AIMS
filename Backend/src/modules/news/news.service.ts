import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { News } from './entities/news.entity';
import { UpdateNewsDto } from './dto/update-news.dto';
import { Product } from '../product/entities/product.entity';
import { ProductInCart } from '../product-in-cart/entities/product-in-cart.entity';
import { OrderDescription } from '../order-description/entities/order-description.entity';
import { EditHistory } from '../edit-history/entities/edit-history.entity';

@Injectable()
export class NewsService extends TypeOrmCrudService<News> {
  constructor(
    @InjectRepository(News)
    private readonly newsRepository: Repository<News>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductInCart)
    private readonly productInCartRepository: Repository<ProductInCart>,
    @InjectRepository(OrderDescription)
    private readonly orderDescriptionRepository: Repository<OrderDescription>,
    @InjectRepository(EditHistory)
    private readonly editHistoryRepository: Repository<EditHistory>,
  ) {
    super(newsRepository);
  }

  async create(data: Partial<News>): Promise<News> {
    const news = this.newsRepository.create(data);
    return this.newsRepository.save(news);
  }

  async update(id: number, updateNewsDto: UpdateNewsDto): Promise<News> {
    await this.newsRepository.update({ news_id: id }, updateNewsDto);
    const news = await this.newsRepository.findOne({ where: { news_id: id } });
    if (!news) {
      throw new Error(`News with id ${id} not found`);
    }
    return news;
  }

  async delete(id: number): Promise<void> {
    const result = await this.newsRepository.delete({ news_id: id });
    if (result.affected === 0) {
      throw new Error(`News with id ${id} not found`);
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

      // 4. Delete from News (subtype)
      const newsResult = await this.newsRepository.delete({
        news_id: productId,
      });
      if (newsResult.affected && newsResult.affected > 0) {
        deletedTables.push(`News (${newsResult.affected} records)`);
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
