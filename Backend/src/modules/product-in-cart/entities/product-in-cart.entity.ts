import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from '../../product/entities/product.entity';
import { Cart } from '../../cart/entities/cart.entity';

@Entity()
export class ProductInCart {
  @PrimaryColumn()
  cart_id: number;
  @ManyToOne(() => Cart, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id', referencedColumnName: 'cart_id' })
  cart: Cart;

  @PrimaryColumn()
  product_id: number;
  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id', referencedColumnName: 'product_id' })
  product: Product;

  @Column('int')
  quantity: number;
}
