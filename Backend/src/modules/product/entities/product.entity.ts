import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('increment')
  product_id: number;

  @Column()
  title: string;

  @Column('int')
  quantity: number;

  @Column('float')
  value: number;

  @Column('float')
  current_price: number;

  @Column()
  manager_id: number;

  @Column()
  category: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'manager_id', referencedColumnName: 'user_id' })
  manager: User;

  @Column('timestamp')
  creation_date: Date;

  @Column()
  description: string;

  @Column()
  barcode: string;

  @Column()
  dimensions: string;

  @Column('float')
  weight: number;

  @Column('timestamp')
  warehouse_entrydate: Date;

  @Column()
  type: 'book' | 'cd' | 'dvd' | 'news';

  @Column({ default: true })
  is_active: boolean;
}
