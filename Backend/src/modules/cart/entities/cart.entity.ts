import {
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity()
export class Cart {
  @PrimaryGeneratedColumn('increment')
  cart_id: number;

  @Column()
  customer_id: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'customer_id', referencedColumnName: 'user_id' })
  customer: User;
}
