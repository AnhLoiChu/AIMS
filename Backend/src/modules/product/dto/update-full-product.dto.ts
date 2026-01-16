import { IsEnum, ValidateNested, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateBookDto } from '../../book/dto/update-book.dto';
import { UpdateCdDto } from '../../cd/dto/update-cd.dto';
import { UpdateDvdDto } from '../../dvd/dto/update-dvd.dto';
import { UpdateNewsDto } from '../../news/dto/update-news.dto';
import { ProductType } from './base-product.dto';
import { UpdateProductDto } from './update-product.dto';
import { ApiProperty, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';

@ApiExtraModels(UpdateBookDto, UpdateCdDto, UpdateDvdDto, UpdateNewsDto)
export class UpdateFullProductDto extends UpdateProductDto {

  @ApiProperty({
    oneOf: [
      { $ref: getSchemaPath(UpdateBookDto) },
      { $ref: getSchemaPath(UpdateCdDto) },
      { $ref: getSchemaPath(UpdateDvdDto) },
      { $ref: getSchemaPath(UpdateNewsDto) },
    ],
    description: 'Subtype fields depending on the product type',
    required: false,
  })
  @ValidateNested()
  @IsOptional()
  @Type((obj) => {
    switch (obj?.object?.type) {
      case ProductType.BOOK:
        return UpdateBookDto;
      case ProductType.CD:
        return UpdateCdDto;
      case ProductType.DVD:
        return UpdateDvdDto;
      case ProductType.NEWS:
        return UpdateNewsDto;
      default:
        return Object;
    }
  })
  subtypeFields?: UpdateBookDto | UpdateCdDto | UpdateDvdDto | UpdateNewsDto;

  @ApiProperty({ 
    example: 2,
    description: 'ID of the manager responsible for the product (must be a user with role_id = 2)',
    required: false
  })
  @IsOptional()
  @IsNumber()
  manager_id?: number;
} 