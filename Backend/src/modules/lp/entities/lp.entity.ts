import { Entity, Column, OneToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Product } from '../../product/entities/product.entity';

@Entity()
export class LP {
  @PrimaryColumn()
  lp_id: number;
  @OneToOne(() => Product)
  @JoinColumn({ name: 'lp_id', referencedColumnName: 'product_id' })
  lp: Product;

  @Column()
  genre: string;

  @Column()
  artist: string;

  @Column()
  record_label: string;

  @Column()
  tracklist: string;

  @Column('timestamp')
  release_date: Date;
}
