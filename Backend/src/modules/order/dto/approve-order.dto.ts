import { OrderStatus } from './order-status.enum';
import { IsOptional, IsEnum, IsString } from 'class-validator';

export class ApproveOrderDto {
  @IsEnum(OrderStatus)
  status: OrderStatus.ACCEPTED | OrderStatus.REJECTED;

  @IsString()
  @IsOptional()
  rejection_reason?: string;
}
