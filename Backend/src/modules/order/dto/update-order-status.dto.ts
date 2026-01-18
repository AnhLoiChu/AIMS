import { OrderStatus } from './order-status.enum';
import { IsString, IsEnum, IsOptional } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
