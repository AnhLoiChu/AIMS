import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateManagerDto {
  @ApiPropertyOptional({ description: 'Manager name', example: 'Nguyen Van A' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Manager email',
    example: 'manager@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Manager phone number',
    example: '0912345678',
  })
  @IsOptional()
  @IsPhoneNumber('VN')
  phone?: string;

  @ApiPropertyOptional({
    description: 'Manager password',
    minLength: 6,
    example: 'secret123',
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
