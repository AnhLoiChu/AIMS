import { Module } from '@nestjs/common';
import { LpService } from './lp.service';
import { LpController } from './lp.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LP } from './entities/lp.entity';
import { Product } from '../product/entities/product.entity';
import { ProductInCart } from '../product-in-cart/entities/product-in-cart.entity';
import { OrderDescription } from '../order-description/entities/order-description.entity';
import { EditHistory } from '../edit-history/entities/edit-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LP,
      Product,
      ProductInCart,
      OrderDescription,
      EditHistory,
    ]),
  ],
  controllers: [LpController],
  providers: [LpService],
  exports: [LpService, TypeOrmModule.forFeature([LP])],
})
export class LpModule {}
