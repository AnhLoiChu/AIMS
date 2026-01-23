import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsArray, IsNumber } from 'class-validator';

export class CreateAdminUserDto {
    @ApiProperty({ example: 'John Doe', description: 'Name of the user' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'john@example.com', description: 'Email of the user' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: '0901234567', description: 'Phone number of the user' })
    @IsString()
    phone: string;

    @ApiProperty({ example: 'password123', description: 'Password for the user' })
    @IsString()
    password: string;

    @ApiProperty({ example: [1, 2], description: 'Array of role IDs to assign', required: false })
    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    roleIds?: number[];
}
