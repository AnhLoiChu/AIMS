import { IsEmail, IsPhoneNumber, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Nguyen Van A', description: 'Customer name' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'customer@example.com',
    description: 'Customer email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '+84901234567',
    description: 'Vietnamese phone number',
  })
  @IsPhoneNumber('VN')
  phone: string;

  @ApiProperty({
    example: 'strongPassword123',
    minLength: 6,
    description: 'Password (min 6 characters)',
  })
  @IsString()
  @MinLength(6)
  password: string;
}
