import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from './order-status.enum';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
