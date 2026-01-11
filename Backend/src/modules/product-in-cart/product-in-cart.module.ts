import { Module } from '@nestjs/common';
import { ProductInCartService } from './product-in-cart.service';
import { ProductInCartController } from './product-in-cart.controller';
import { ProductInCart } from './entities/product-in-cart.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartService } from '../cart/cart.service';
import { CartController } from '../cart/cart.controller';
import { Cart } from '../cart/entities/cart.entity';
import { Product } from '../product/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductInCart, Cart, Product])],
  controllers: [ProductInCartController],
  providers: [ProductInCartService],
})
export class ProductInCartModule {}
