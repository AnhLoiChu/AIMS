import { Entity, Column, OneToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Product } from '../../product/entities/product.entity';

@Entity()
export class CD {
  @PrimaryColumn()
  cd_id: number;
  @OneToOne(() => Product)
  @JoinColumn({ name: 'cd_id', referencedColumnName: 'product_id' })
  cd: Product;

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
