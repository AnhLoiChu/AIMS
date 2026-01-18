import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateProductDto } from '../dto/create-product.dto';
import { Product } from '../entities/product.entity';
import { IProductValidator } from '../interfaces/product-validator.interface';
import { UpdateFullProductDto } from '../dto/update-full-product.dto';
import { EDIT_LIMITS } from '../../../constants/edit-limits.constants';

@Injectable()
export class ProductValidatorService implements IProductValidator {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) { }

  async validateUpdate(id: number, dto: UpdateFullProductDto): Promise<void> {
    const existingProduct = await this.productRepo.findOne({
      where: { product_id: id },
    });

    if (!existingProduct) {
      throw new BadRequestException(`Product with id ${id} not found`);
    }

    // Check duplicate excluding current product
    if (dto.title !== undefined || dto.barcode !== undefined) {
      const barcodeToCheck = dto.barcode ?? existingProduct.barcode;
      const titleToCheck = dto.title ?? existingProduct.title;

      await this.checkDuplicateProduct(
        titleToCheck,
        barcodeToCheck,
        existingProduct.manager_id,
        id
      );
    }

    // Check quantity validation
    if (dto.quantity !== undefined && dto.quantity < 0) {
      throw new BadRequestException('Số lượng sản phẩm cập nhật không được âm');
    }
  }

  async validateCreate(dto: CreateProductDto): Promise<void> {
    await this.checkDuplicateProduct(dto.title, dto.barcode, dto.manager_id);

    // Check quantity validation
    if (dto.quantity < 0) {
      throw new BadRequestException('Số lượng sản phẩm khi thêm mới không được âm');
    }
  }

  async validateDelete(productIds: number[]): Promise<void> {
    if (productIds.length > EDIT_LIMITS.MAX_PRODUCTS_DELETE_AT_ONCE) {
      throw new BadRequestException(
        `Chỉ được phép xóa tối đa ${EDIT_LIMITS.MAX_PRODUCTS_DELETE_AT_ONCE} sản phẩm cùng lúc`,
      );
    }
  }

  private async checkDuplicateProduct(
    title: string,
    barcode: string,
    managerId: number,
    excludeId?: number
  ): Promise<void> {
    const queryBuilder = this.productRepo
      .createQueryBuilder('product')
      .where('product.barcode = :barcode', { barcode })
      .andWhere('product.title = :title', { title })
      .andWhere('product.manager_id = :managerId', { managerId });

    if (excludeId) {
      queryBuilder.andWhere('product.product_id != :excludeId', { excludeId });
    }

    const duplicate = await queryBuilder.getOne();
    if (duplicate) {
      throw new BadRequestException(
        `Đã tồn tại sản phẩm có cùng tên "${title}" và barcode "${barcode}" trong cùng manager ID ${managerId}`
      );
    }
  }
} 