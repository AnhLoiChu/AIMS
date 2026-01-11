import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('increment')
  product_id: number;

  @Column()
  title: string;

  @Column('float')
  value: number;

  @Column('int')
  quantity: number;

  @Column('float')
  current_price: number;

  @Column()
  category: string;

  @Column()
  manager_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'manager_id', referencedColumnName: 'user_id' })
  manager: User;

  @Column('timestamp')
  creation_date: Date;

  @Column()
  rush_order_eligibility: boolean;

  @Column()
  barcode: string;

  @Column()
  description: string;

  @Column('float')
  weight: number;

  @Column()
  dimensions: string;

  @Column()
  type: 'book' | 'cd' | 'dvd' | 'lp';

  @Column('timestamp')
  warehouse_entrydate: Date;
}
