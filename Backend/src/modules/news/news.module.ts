import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { News } from './entities/news.entity';
import { Product } from '../product/entities/product.entity';
import { ProductInCart } from '../product-in-cart/entities/product-in-cart.entity';
import { OrderDescription } from '../order-description/entities/order-description.entity';
import { EditHistory } from '../edit-history/entities/edit-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      News,
      Product,
      ProductInCart,
      OrderDescription,
      EditHistory,
    ]),
  ],
  controllers: [NewsController],
  providers: [NewsService],
  exports: [NewsService, TypeOrmModule.forFeature([News])],
})
export class NewsModule {}
