import { Module } from '@nestjs/common';
import { DvdService } from './dvd.service';
import { DvdController } from './dvd.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DVD } from './entities/dvd.entity';
import { Product } from '../product/entities/product.entity';
import { ProductInCart } from '../product-in-cart/entities/product-in-cart.entity';
import { OrderDescription } from '../order-description/entities/order-description.entity';
import { EditHistory } from '../edit-history/entities/edit-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DVD,
      Product,
      ProductInCart,
      OrderDescription,
      EditHistory,
    ]),
  ],
  controllers: [DvdController],
  providers: [DvdService],
  exports: [DvdService, TypeOrmModule.forFeature([DVD])],
})
export class DvdModule {}
