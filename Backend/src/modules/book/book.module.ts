import { Module } from '@nestjs/common';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from './entities/book.entity';
import { Product } from '../product/entities/product.entity';
import { ProductInCart } from '../product-in-cart/entities/product-in-cart.entity';
import { OrderDescription } from '../order-description/entities/order-description.entity';
import { EditHistory } from '../edit-history/entities/edit-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Book,
      Product,
      ProductInCart,
      OrderDescription,
      EditHistory,
    ]),
  ],
  controllers: [BookController],
  providers: [BookService],
  exports: [BookService, TypeOrmModule.forFeature([Book])],
})
export class BookModule {}
