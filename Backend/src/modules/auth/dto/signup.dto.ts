import { IsEmail, IsPhoneNumber, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({ example: 'Nguyen Van A', description: 'User full name' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '0987654321',
    description: 'Vietnamese phone number',
  })
  @IsPhoneNumber('VN')
  phone: string;

  @ApiProperty({
    example: 'strongPassword123',
    minLength: 6,
    description: 'User password (min 6 characters)',
  })
  @IsString()
  @MinLength(6)
  password: string;
}
