import { Module } from '@nestjs/common';
import { CdService } from './cd.service';
import { CdController } from './cd.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CD } from './entities/cd.entity';
import { Product } from '../product/entities/product.entity';
import { ProductInCart } from '../product-in-cart/entities/product-in-cart.entity';
import { OrderDescription } from '../order-description/entities/order-description.entity';
import { EditHistory } from '../edit-history/entities/edit-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CD,
      Product,
      ProductInCart,
      OrderDescription,
      EditHistory,
    ]),
  ],
  controllers: [CdController],
  providers: [CdService],
  exports: [CdService, TypeOrmModule.forFeature([CD])],
})
export class CdModule {}
