import { Injectable, BadRequestException } from '@nestjs/common';
import { BookService } from '../../book/book.service';
import { CdService } from '../../cd/cd.service';
import { DvdService } from '../../dvd/dvd.service';
import { LpService } from '../../lp/lp.service';
import { ProductType } from '../dto/base-product.dto';
import { IProductSubtypeService } from '../interfaces/product-subtype.interface';

export interface IProductSubtypeFactory {
  getService(type: ProductType): IProductSubtypeService<any, any, any>;
  getIdField(type: ProductType): string;
}

@Injectable()
export class ProductSubtypeFactory implements IProductSubtypeFactory {
  private readonly serviceMap = new Map<ProductType, IProductSubtypeService<any, any, any>>();

  constructor(
    private readonly bookService: BookService,
    private readonly cdService: CdService,
    private readonly dvdService: DvdService,
    private readonly lpService: LpService,
  ) {
    this.initializeServices();
  }

  private initializeServices(): void {
    this.serviceMap.set(ProductType.BOOK, this.bookService);
    this.serviceMap.set(ProductType.CD, this.cdService);
    this.serviceMap.set(ProductType.DVD, this.dvdService);
    this.serviceMap.set(ProductType.LP, this.lpService);
  }

  getService(type: ProductType): IProductSubtypeService<any, any, any> {
    const service = this.serviceMap.get(type);
    if (!service) {
      throw new BadRequestException(`Unsupported product type: ${type}`);
    }
    return service;
  }

  getIdField(type: ProductType): string {
    const fieldMap = {
      [ProductType.BOOK]: 'book_id',
      [ProductType.CD]: 'cd_id',
      [ProductType.DVD]: 'dvd_id',
      [ProductType.LP]: 'lp_id',
    };
    return fieldMap[type];
  }
} 