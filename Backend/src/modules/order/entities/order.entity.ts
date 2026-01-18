import {
  ManyToOne,
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { IsNumber, IsEnum, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../dto/order-status.enum';
import { Cart } from '../../cart/entities/cart.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn('increment')
  order_id: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PLACING,
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @Column('float')
  @IsNumber()
  subtotal: number;

  @Column()
  cart_id: number;

  @ManyToOne(() => Cart)
  @JoinColumn({ name: 'cart_id', referencedColumnName: 'cart_id' })
  cart: Cart;

  @Column('timestamp', { nullable: true })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  accept_date: Date | null;

  @Column('float')
  @IsNumber()
  delivery_fee: number;
}
