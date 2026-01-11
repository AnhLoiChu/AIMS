import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ProductInCartService } from './product-in-cart.service';
import { CreateProductInCartDto } from './dto/create-product-in-cart.dto';
import { UpdateProductInCartDto } from './dto/update-product-in-cart.dto';
import { Crud, CrudController } from '@dataui/crud';
import { ProductInCart } from './entities/product-in-cart.entity';

@Crud({
  model: { type: ProductInCart },
  dto: {
    create: CreateProductInCartDto,
    update: UpdateProductInCartDto,
  },
  params: {
    cart_id: {
      field: 'cart_id',
      type: 'number',
      primary: true,
    },
    product_id: {
      field: 'product_id',
      type: 'number',
      primary: true,
    },
  },
})
@Controller('product-in-cart')
export class ProductInCartController implements CrudController<ProductInCart> {
  constructor(public readonly service: ProductInCartService) {}

  // add product to cart using procut_in_cart; not check availability of product in database
  @Post('add-product')
  async addProductToCart(
    @Body('cartId') cartId: number,
    @Body('productId') productId: number,
    @Body('quantity') quantity: number,
  ) {
    return this.service.addProductToCart(cartId, productId, quantity);
  }

  // remove product from cart; removing quantity > product's quantity in cart = remove product from cart
  @Post('remove-product')
  async removeProductFromCart(
    @Body('cartId') cartId: number,
    @Body('productId') productId: number,
    @Body('quantity') quantity: number,
  ) {
    return this.service.removeProductFromCart(cartId, productId, quantity);
  }
}
