import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsDate,
  IsPhoneNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Order } from '../../order/entities/order.entity';

@Entity()
export class DeliveryInfo {
  @PrimaryGeneratedColumn('increment')
  delivery_id: number;

  @Column()
  @IsString()
  recipient_name: string;

  @Column()
  @IsEmail()
  email: string;

  @Column()
  @IsPhoneNumber('VN')
  phone: string;

  @Column()
  order_id: number;

  @OneToOne(() => Order)
  @JoinColumn({ name: 'order_id', referencedColumnName: 'order_id' })
  order: Order;

  @Column()
  @IsString()
  province: string;

  @Column()
  @IsString()
  address: string;

  @Column('text', { nullable: true })
  @IsOptional()
  @IsString()
  instruction: string | null;

  @Column('timestamp', { nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  delivery_time: Date | null;
}
