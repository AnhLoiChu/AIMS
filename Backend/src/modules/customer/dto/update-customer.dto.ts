import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateCustomerDto {
  @ApiPropertyOptional({ description: 'Customer name', example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Customer email',
    example: 'john@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Customer phone number',
    example: '0912345678',
  })
  @IsOptional()
  @IsPhoneNumber('VN')
  phone?: string;

  @ApiPropertyOptional({
    description: 'Customer password (min 6 chars)',
    minLength: 6,
    example: 'secret123',
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
