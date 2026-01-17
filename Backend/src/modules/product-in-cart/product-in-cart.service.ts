import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { ProductInCart } from './entities/product-in-cart.entity';
import { Cart } from '../cart/entities/cart.entity';
import { Product } from '../product/entities/product.entity';

@Injectable()
export class ProductInCartService extends TypeOrmCrudService<ProductInCart> {
  constructor(
    @InjectRepository(ProductInCart)
    public readonly productInCartRepository: Repository<ProductInCart>,
    @InjectRepository(Cart)
    public readonly cartRepository: Repository<Cart>,
    @InjectRepository(Product)
    public readonly productRepository: Repository<Product>,
  ) {
    super(productInCartRepository);
  }

  // add product to cart via product_in_cart
  async addProductToCart(cartId: number, productId: number, quantity: number) {
    // check if cart exist
    const cart = await this.cartRepository.findOne({
      where: { cart_id: cartId },
    });
    if (!cart) {
      throw new NotFoundException(`Cart with ID ${cartId} not found`);
    }

    // check if product exist
    const product = await this.productRepository.findOne({
      where: { product_id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // check if product already in cart and if product quantity is sufficient
    let productInCart = await this.productInCartRepository.findOne({
      where: { cart_id: cartId, product_id: productId },
    });

    if (product.quantity > quantity) {
      if (productInCart) {
        productInCart.quantity += quantity;
      } else {
        productInCart = this.productInCartRepository.create({
          cart_id: cartId,
          product_id: productId,
          quantity,
          cart,
          product,
        });
      }
    } else {
      throw new BadRequestException(
        `Product with ID ${productId} has insufficient quantity: ${product.quantity} left`,
      );
    }
    return this.productInCartRepository.save(productInCart);
  }

  // remove product from cart via product_in_cart
  async removeProductFromCart(
    cartId: number,
    productId: number,
    quantity: number,
  ) {
    // check if cart exist
    const cart = await this.cartRepository.findOne({
      where: { cart_id: cartId },
    });
    if (!cart) {
      throw new NotFoundException(`Cart with ID ${cartId} not found`);
    }

    // check if product exist
    const product = await this.productRepository.findOne({
      where: { product_id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // remove product from cart, if quantity > product_in_cart.quantity -> remove product from cart
    const productInCart = await this.productInCartRepository.findOne({
      where: { cart_id: cartId, product_id: productId },
    });
    if (!productInCart) {
      throw new BadRequestException(
        `Cart ${cartId} does not contain product ${productId}`,
      );
    } else {
      if (quantity > 0 && productInCart.quantity > quantity) {
        productInCart.quantity -= quantity;
        return this.productInCartRepository.save(productInCart);
      } else {
        await this.productInCartRepository.remove(productInCart);
        return {
          message: `Product ${productId} is removed from cart ${cartId}`,
        };
      }
    }
  }
}
