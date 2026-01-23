import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsBoolean, IsArray, IsNumber } from 'class-validator';

export class UpdateAdminUserDto {
    @ApiProperty({ example: 'John Doe', description: 'Name of the user', required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ example: 'john@example.com', description: 'Email of the user', required: false })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({ example: '0901234567', description: 'Phone number of the user', required: false })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ example: true, description: 'Whether user is active', required: false })
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;

    @ApiProperty({ example: [1, 2], description: 'Array of role IDs to assign', required: false })
    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    roleIds?: number[];
}
