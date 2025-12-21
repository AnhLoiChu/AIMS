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

  // Additional VNPAY specific fields (not in original schema but needed for tracking)
  @Column({ type: 'varchar', length: 100, nullable: true })
  vnp_txn_ref: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  vnp_transaction_no: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  vnp_response_code: string;

  @Column({ type: 'text', nullable: true })
  raw_response: string;
}
