// book.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from './entities/book.entity';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { UpdateBookDto } from './dto/update-book.dto';
import { Product } from '../product/entities/product.entity';
import { ProductInCart } from '../product-in-cart/entities/product-in-cart.entity';
import { OrderDescription } from '../order-description/entities/order-description.entity';
import { EditHistory } from '../edit-history/entities/edit-history.entity';

@Injectable()
export class BookService extends TypeOrmCrudService<Book> {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductInCart)
    private readonly productInCartRepository: Repository<ProductInCart>,
    @InjectRepository(OrderDescription)
    private readonly orderDescriptionRepository: Repository<OrderDescription>,
    @InjectRepository(EditHistory)
    private readonly editHistoryRepository: Repository<EditHistory>,
  ) {
    super(bookRepository);
  }

  async create(data: Partial<Book>): Promise<Book> {
    const book = this.bookRepository.create(data);
    return this.bookRepository.save(book);
  }

  async update(id: number, updateBookDto: UpdateBookDto): Promise<Book> {
    await this.bookRepository.update({ book_id: id }, updateBookDto);
    const book = await this.bookRepository.findOne({ where: { book_id: id } });
    if (!book) {
      throw new Error(`Book with id ${id} not found`);
    }
    return book;
  }

  async delete(id: number): Promise<void> {
    const result = await this.bookRepository.delete({ book_id: id });
    if (result.affected === 0) {
      throw new Error(`Book with id ${id} not found`);
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

      // 4. Delete from Book (subtype)
      const bookResult = await this.bookRepository.delete({
        book_id: productId,
      });
      if (bookResult.affected && bookResult.affected > 0) {
        deletedTables.push(`Book (${bookResult.affected} records)`);
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
