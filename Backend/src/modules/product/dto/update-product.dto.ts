export class UpdateProductDto {
  title?: string;
  value?: number;
  quantity?: number;
  current_price?: number;
  category?: string;
  creation_date?: Date;

  barcode?: string;
  description?: string;
  weight?: number;
  dimensions?: string;
  type?: string;
  warehouse_entrydate?: Date;
}
