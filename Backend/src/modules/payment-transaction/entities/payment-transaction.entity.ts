import { Order } from '../../order/entities/order.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity('payment_transaction')
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  payment_transaction_id: string;

  @Column({ type: 'varchar' })
  method: string;

  @Column({ type: 'varchar', nullable: true })
  bank_name: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  time: Date;

  @Column({ type: 'varchar' })
  content: string;

  @Column({ type: 'varchar' })
  status: string; // PENDING, SUCCESS, FAILED, CANCELLED

  @Column({ type: 'int' })
  order_id: number;

  // Relationship with Order table
  @OneToOne(() => Order)
  @JoinColumn({ name: 'order_id', referencedColumnName: 'order_id' })
  order: Order;

  @Column({ type: 'text', nullable: true })
  raw_response: string;
}
