import { Entity, Column, OneToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Product } from '../../product/entities/product.entity';

@Entity()
export class DVD {
  @PrimaryColumn()
  dvd_id: number;
  @OneToOne(() => Product)
  @JoinColumn({ name: 'dvd_id', referencedColumnName: 'product_id' })
  dvd: Product;

  @Column()
  language: string;

  @Column()
  subtitles: string;

  @Column()
  runtime: string;

  @Column()
  disc_type: string;

  @Column('timestamp')
  release_date: Date;

  @Column()
  studio: string;

  @Column()
  director: string;

  @Column()
  genre: string;
}
