import { Type } from 'class-transformer';
import { IsEnum, ValidateNested } from 'class-validator';
import { CreateCdDto } from '../../cd/dto/create-cd.dto';
import { CreateBookDto } from '../../book/dto/create-book.dto';
import { CreateNewsDto } from '../../news/dto/create-news.dto';
import { CreateDvdDto } from '../../dvd/dto/create-dvd.dto';
import { BaseProductDto } from './base-product.dto';
import { ProductType } from './base-product.dto';
import { getSchemaPath, ApiProperty, ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels(CreateBookDto, CreateCdDto, CreateDvdDto, CreateNewsDto)
export class CreateProductDto extends BaseProductDto {
  @ApiProperty({ enum: ProductType, description: 'Type of the product' })
  @IsEnum(ProductType)
  type: ProductType;

  @ApiProperty({
    oneOf: [
      { $ref: getSchemaPath(CreateCdDto) },
      { $ref: getSchemaPath(CreateBookDto) },
      { $ref: getSchemaPath(CreateNewsDto) },
      { $ref: getSchemaPath(CreateDvdDto) },
    ],
    description: 'Subtype fields depending on the product type',
  })
  @ValidateNested()
  @Type((obj) => {
    switch (obj?.object?.type) {
      case ProductType.CD:
        return CreateCdDto;
      case ProductType.BOOK:
        return CreateBookDto;
      case ProductType.NEWS:
        return CreateNewsDto;
      case ProductType.DVD:
        return CreateDvdDto;
      default:
        return Object;
    }
  })
  subtypeFields: CreateBookDto | CreateCdDto | CreateDvdDto | CreateNewsDto;
}
