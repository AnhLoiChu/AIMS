import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

export class SetRolesDto {
    @ApiProperty({ example: [1, 2], description: 'Array of role IDs to assign' })
    @IsArray()
    @IsNumber({}, { each: true })
    roleIds: number[];
}
