import { Entity, Column, OneToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Product } from '../../product/entities/product.entity';

@Entity()
export class News {
  @PrimaryColumn()
  news_id: number;

  @OneToOne(() => Product)
  @JoinColumn({ name: 'news_id', referencedColumnName: 'product_id' })
  news: Product;

  // Editor in Chief
  @Column()
  editor_in_chief: string;

  // Publisher
  @Column()
  publisher: string;

  // Publication Date
  @Column('timestamp')
  publication_date: Date;

  // Issue Number
  @Column()
  issue_number: string;

  // Publication Frequency (daily, weekly, monthly, etc.)
  @Column()
  publication_frequency: string;

  // ISSN Code
  @Column({ nullable: true })
  issn: string;

  // Language
  @Column()
  language: string;

  // Sections (comma separated or JSON)
  @Column('text')
  sections: string;
}
