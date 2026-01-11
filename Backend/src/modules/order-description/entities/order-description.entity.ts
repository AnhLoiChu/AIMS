import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from '../../order/entities/order.entity';
import { Product } from '../../product/entities/product.entity';

@Entity()
export class OrderDescription {
  @PrimaryColumn()
  order_id: number;
  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id', referencedColumnName: 'order_id' })
  order: Order;

  @PrimaryColumn()
  product_id: number;
  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id', referencedColumnName: 'product_id' })
  product: Product;

  @Column('int')
  quantity: number;

  @Column()
  is_rush: boolean;
}
