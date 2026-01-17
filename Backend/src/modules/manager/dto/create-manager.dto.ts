import {
  IsEmail,
  IsString,
  MinLength,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateManagerDto {
  @ApiProperty({ example: 'Nguyen Van A', description: 'Manager name' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'manager@example.com',
    description: 'Manager email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '0901234567',
    description: 'Phone number',
  })
  @IsString()
  phone: string;

  @ApiProperty({
    example: 'strongPassword123',
    minLength: 6,
    description: 'Password (min 6 characters)',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 0,
    default: 0,
    description: 'Number of edits performed by manager',
  })
  @IsOptional()
  @IsNumber()
  edit_count: number = 0;

  @ApiProperty({
    example: 0,
    default: 0,
    description: 'Number of deletions performed by manager',
  })
  @IsOptional()
  @IsNumber()
  delete_count: number = 0;
}
