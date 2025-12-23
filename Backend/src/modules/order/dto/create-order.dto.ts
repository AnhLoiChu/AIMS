import { IsEnum, IsNumber, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../dto/order-status.enum';

export class CreateOrderDto {
  @IsNumber()
  subtotal: number;

  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  accept_date?: Date;

  @IsNumber()
  delivery_fee: number;
}
