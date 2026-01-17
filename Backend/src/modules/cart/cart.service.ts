import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { ProductInCart } from '../product-in-cart/entities/product-in-cart.entity';

@Injectable()
export class CartService extends TypeOrmCrudService<Cart> {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(ProductInCart)
    private readonly productInCartRepository: Repository<ProductInCart>,
  ) {
    super(cartRepository);
  }

  // empty cart
  async emptyCart(cartId: number) {
    await this.productInCartRepository.delete({ cart_id: cartId });
  }

  // view cart
  async viewCart(cartId: number) {
    const cart = await this.cartRepository.findOne({
      where: { cart_id: cartId },
    });
    if (!cart) {
      throw new NotFoundException({
        code: 'CART_NOT_FOUND',
        message: `Cart ID ${cartId} not found`,
      });
    }

    const productInCarts = await this.productInCartRepository.find({
      where: { cart_id: cartId },
      relations: ['product'],
    });
    if (productInCarts.length === 0) {
      return {
        message: `Cart ID ${cartId} is empty`,
      };
    } else return { productInCarts };
  }
}
