import { Type } from 'class-transformer';
import { ValidateNested, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { UpdateCdDto } from '../../cd/dto/update-cd.dto';
import { UpdateBookDto } from '../../book/dto/update-book.dto';
import { UpdateNewsDto } from '../../news/dto/update-news.dto';
import { UpdateDvdDto } from '../../dvd/dto/update-dvd.dto';
import { UpdateProductDto } from './update-product.dto';
import { ProductType } from './base-product.dto';
import { getSchemaPath, ApiProperty, ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels(UpdateBookDto, UpdateCdDto, UpdateDvdDto, UpdateNewsDto)
export class UpdateFullProductDto extends UpdateProductDto {

  @ApiProperty({
    oneOf: [
      { $ref: getSchemaPath(UpdateCdDto) },
      { $ref: getSchemaPath(UpdateBookDto) },
      { $ref: getSchemaPath(UpdateNewsDto) },
      { $ref: getSchemaPath(UpdateDvdDto) },
    ],
    description: 'Subtype fields depending on the product type',
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type((obj) => {
    switch (obj?.object?.type) {
      case ProductType.CD:
        return UpdateCdDto;
      case ProductType.BOOK:
        return UpdateBookDto;
      case ProductType.NEWS:
        return UpdateNewsDto;
      case ProductType.DVD:
        return UpdateDvdDto;
      default:
        return Object;
    }
  })
  subtypeFields?: UpdateBookDto | UpdateCdDto | UpdateDvdDto | UpdateNewsDto;

  @ApiProperty({
    example: 2,
    required: false,
    description: 'ID of the manager responsible for the product (must be a user with role_id = 2)',
  })
  @IsNumber()
  @IsOptional()
  manager_id?: number;
} 