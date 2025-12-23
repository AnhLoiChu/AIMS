import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from './order-status.enum';

export class ApproveOrderDto {
  @IsEnum(OrderStatus)
  status: OrderStatus.ACCEPTED | OrderStatus.REJECTED;

  @IsOptional()
  @IsString()
  rejection_reason?: string;
}
