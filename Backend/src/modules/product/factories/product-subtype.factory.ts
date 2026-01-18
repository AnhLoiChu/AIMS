import { BadRequestException, Injectable } from '@nestjs/common';
import { CdService } from '../../cd/cd.service';
import { BookService } from '../../book/book.service';
import { NewsService } from '../../news/news.service';
import { DvdService } from '../../dvd/dvd.service';
import { IProductSubtypeService } from '../interfaces/product-subtype.interface';
import { ProductType } from '../dto/base-product.dto';

export interface IProductSubtypeFactory {
  getIdField(type: ProductType): string;
  getService(type: ProductType): IProductSubtypeService<any, any, any>;
}

@Injectable()
export class ProductSubtypeFactory implements IProductSubtypeFactory {
  private readonly serviceMap = new Map<ProductType, IProductSubtypeService<any, any, any>>();

  constructor(
    private readonly cdService: CdService,
    private readonly bookService: BookService,
    private readonly newsService: NewsService,
    private readonly dvdService: DvdService,
  ) {
    this.initializeServices();
  }

  getIdField(type: ProductType): string {
    const fieldMap = {
      [ProductType.CD]: 'cd_id',
      [ProductType.BOOK]: 'book_id',
      [ProductType.NEWS]: 'news_id',
      [ProductType.DVD]: 'dvd_id',
    };
    return fieldMap[type];
  }

  getService(type: ProductType): IProductSubtypeService<any, any, any> {
    const service = this.serviceMap.get(type);
    if (!service) {
      throw new BadRequestException(`Unsupported product type: ${type}`);
    }
    return service;
  }

  private initializeServices(): void {
    this.serviceMap.set(ProductType.CD, this.cdService);
    this.serviceMap.set(ProductType.BOOK, this.bookService);
    this.serviceMap.set(ProductType.NEWS, this.newsService);
    this.serviceMap.set(ProductType.DVD, this.dvdService);
  }
} 