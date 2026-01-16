import { IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateBookDto } from '../../book/dto/create-book.dto';
import { CreateCdDto } from '../../cd/dto/create-cd.dto';
import { CreateDvdDto } from '../../dvd/dto/create-dvd.dto';
import { CreateNewsDto } from '../../news/dto/create-news.dto';
import { ProductType } from './base-product.dto';
import { BaseProductDto } from './base-product.dto';
import { ApiProperty, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';

@ApiExtraModels(CreateBookDto, CreateCdDto, CreateDvdDto, CreateNewsDto)
export class CreateProductDto extends BaseProductDto {
  @ApiProperty({ enum: ProductType, description: 'Type of the product' })
  @IsEnum(ProductType)
  type: ProductType;

  @ApiProperty({
    oneOf: [
      { $ref: getSchemaPath(CreateBookDto) },
      { $ref: getSchemaPath(CreateCdDto) },
      { $ref: getSchemaPath(CreateDvdDto) },
      { $ref: getSchemaPath(CreateNewsDto) },
    ],
    description: 'Subtype fields depending on the product type',
  })
  @ValidateNested()
  @Type((obj) => {
    switch (obj?.object?.type) {
      case ProductType.BOOK:
        return CreateBookDto;
      case ProductType.CD:
        return CreateCdDto;
      case ProductType.DVD:
        return CreateDvdDto;
      case ProductType.NEWS:
        return CreateNewsDto;
      default:
        return Object;
    }
  })
  subtypeFields: CreateBookDto | CreateCdDto | CreateDvdDto | CreateNewsDto;
}
