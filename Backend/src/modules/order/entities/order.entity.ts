import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IsEnum, IsNumber, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { Cart } from '../../cart/entities/cart.entity';
import { OrderStatus } from '../dto/order-status.enum';
@Entity()
export class Order {
  @PrimaryGeneratedColumn('increment')
  order_id: number;

  @Column('float')
  @IsNumber()
  subtotal: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PLACING,
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @Column('timestamp', { nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  accept_date: Date | null;

  @Column()
  cart_id: number;
  @ManyToOne(() => Cart)
  @JoinColumn({ name: 'cart_id', referencedColumnName: 'cart_id' })
  cart: Cart;

  @Column('float')
  @IsNumber()
  delivery_fee: number;
}
