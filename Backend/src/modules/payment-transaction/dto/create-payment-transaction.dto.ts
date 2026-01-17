import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentTransactionDto {
  @ApiProperty({ description: 'ID of the order' })
  @IsNotEmpty()
  order_id: number;

  @ApiProperty({ description: 'Description of the order' })
  @IsNotEmpty()
  @IsString()
  orderDescription: string;

  @ApiProperty({ description: 'Type of the order' })
  @IsNotEmpty()
  @IsString()
  orderType: string;

  @ApiPropertyOptional({ description: 'Bank code (optional)' })
  @IsOptional()
  @IsString()
  bankCode?: string;

  @ApiPropertyOptional({ description: 'Language (optional)' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Payment method (VIETQR, PAYPAL, etc.)' })
  @IsOptional()
  @IsString()
  method?: string;
}
