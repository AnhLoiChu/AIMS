export class UpdateProductDto {
  title?: string;
  value?: number;
  quantity?: number;
  current_price?: number;
  category?: string;
  creation_date?: Date;
  rush_order_eligibility?: boolean;
  barcode?: string;
  description?: string;
  weight?: number;
  dimensions?: string;
  type?: string;
  warehouse_entrydate?: Date;
}
