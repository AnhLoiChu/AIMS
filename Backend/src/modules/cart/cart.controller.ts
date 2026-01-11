import { Controller, Get, Param, Post } from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { Cart } from './entities/cart.entity';
import { Crud, CrudController } from '@dataui/crud';

@Crud({
  model: { type: Cart },
  dto: {
    create: CreateCartDto,
    update: UpdateCartDto,
  },
  params: {
    cart_id: {
      field: 'cart_id',
      type: 'number',
      primary: true,
    },
  },
})
@Controller('cart')
export class CartController implements CrudController<Cart> {
  constructor(public service: CartService) {}

  // empty cart
  @Post('empty/:cart_id')
  async emptyCart(@Param('cart_id') cartId: number) {
    await this.service.emptyCart(cartId);
    return {
      success: true,
      message: `All products removed from cart ID ${cartId}`,
    };
  }

  // view cart
  @Get('view/:cart_id')
  async viewCart(@Param('cart_id') cartId: number) {
    return await this.service.viewCart(cartId);
  }
}
