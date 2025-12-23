import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Product } from '../../product/entities/product.entity';
import { ManyToOne, JoinColumn } from 'typeorm';
export enum EditAction {
  ADD = 'add',
  EDIT = 'edit',
  DELETE = 'delete',
}

@Entity()
export class EditHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: number;

  @Column({
    type: 'enum',
    enum: EditAction,
  })
  action: EditAction;

  @Column('text')
  change_description: string;

  @CreateDateColumn()
  edit_time: Date;
}
