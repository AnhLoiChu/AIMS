import { ApiProperty } from '@nestjs/swagger';

export enum ProductType {
  BOOK = 'book',
  CD = 'cd',
  DVD = 'dvd',
  LP = 'lp',
}

export class BaseProductDto {
  @ApiProperty({
    example: 'The Great Gatsby',
    description: 'Title of the product',
  })
  title: string;

  @ApiProperty({ example: 100, description: 'Value of the product' })
  value: number;

  @ApiProperty({ example: 10, description: 'Quantity in stock' })
  quantity: number;

  @ApiProperty({ example: 95, description: 'Current price of the product' })
  current_price: number;

  @ApiProperty({
    example: 'Literature',
    description: 'Category of the product',
  })
  category: string;

  @ApiProperty({
    example: '2024-06-01T00:00:00.000Z',
    description: 'Creation date of the product',
    type: String,
    format: 'date-time',
  })
  creation_date: Date;

  @ApiProperty({ example: true, description: 'Eligibility for rush order' })
  rush_order_eligibility: boolean;

  @ApiProperty({
    example: '1234567890123',
    description: 'Barcode of the product',
  })
  barcode: string;

  @ApiProperty({
    example: 'A classic novel by F. Scott Fitzgerald',
    description: 'Description of the product',
  })
  description: string;

  @ApiProperty({
    example: 0.5,
    description: 'Weight of the product in kilograms',
  })
  weight: number;

  @ApiProperty({
    example: '20x15x3 cm',
    description: 'Dimensions of the product',
  })
  dimensions: string;

  @ApiProperty({
    example: '2024-06-01T00:00:00.000Z',
    description: 'Warehouse entry date',
    type: String,
    format: 'date-time',
  })
  warehouse_entrydate: Date;

  @ApiProperty({
    example: 1,
    description: 'ID of the manager responsible for the product',
  })
  manager_id: number;
}
