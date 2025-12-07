import { Entity, Column, OneToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Product } from '../../product/entities/product.entity';

@Entity()
export class Book {
  @PrimaryColumn()
  book_id: number;
  @OneToOne(() => Product)
  @JoinColumn({ name: 'book_id', referencedColumnName: 'product_id' })
  book: Product;

  @Column()
  author: string;

  @Column()
  cover_type: string;

  @Column()
  publisher: string;

  @Column('timestamp')
  publication_date: Date;

  @Column('int')
  number_of_pages: number;

  @Column()
  language: string;

  @Column()
  genre: string;
}
