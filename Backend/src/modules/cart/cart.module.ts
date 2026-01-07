import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { ProductInCart } from '../product-in-cart/entities/product-in-cart.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, ProductInCart])],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
