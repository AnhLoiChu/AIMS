import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductType } from './dto/base-product.dto';
import { DeleteProductsDto } from './dto/delete-products.dto';
import { UpdateFullProductDto } from './dto/update-full-product.dto';
import { EditAction } from '../edit-history/entities/edit-history.entity';
import { EditHistoryService } from '../edit-history/edit-history.service';
import { ProductSubtypeFactory } from './factories/product-subtype.factory';
import { UserService } from '../user/user.service';
import { ProductBusinessRulesService } from './services/product-business-rules.service';
import { ProductValidatorService } from './services/product-validator.service';
import { CascadeDeletionService } from './services/cascade-deletion.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly editHistoryService: EditHistoryService,
    private readonly productSubtypeFactory: ProductSubtypeFactory,
    private readonly userService: UserService,
    private readonly productValidator: ProductValidatorService,
    private readonly cascadeDeletionService: CascadeDeletionService,
    private readonly productBusinessRules: ProductBusinessRulesService,
  ) { }

  async findByIds(ids: number[]): Promise<Product[]> {
    return await this.productRepo.find({
      where: { product_id: In(ids) },
    });
  }

  async findOne(
    id: number,
  ): Promise<(Product & Record<string, unknown>) | null> {
    const product = await this.productRepo.findOne({
      where: { product_id: id },
    });

    if (!product) return null;

    // Use factory to get appropriate service
    const subtypeService = this.productSubtypeFactory.getService(
      product.type as ProductType,
    );
    const idField = this.productSubtypeFactory.getIdField(
      product.type as ProductType,
    );

    const subtypeData = await subtypeService.findOne({
      where: { [idField]: id },
    });

    if (!subtypeData) {
      throw new BadRequestException(
        `Không tìm thấy dữ liệu con cho sản phẩm ID ${id}`,
      );
    }

    return { ...product, ...subtypeData };
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { type, subtypeFields, ...baseFields } = createProductDto;

    // Validation using dedicated validator
    await this.productValidator.validateCreate(createProductDto);

    // Create base product
    const product = this.productRepo.create({
      ...baseFields,
      type,
      warehouse_entrydate: new Date(),
      creation_date: new Date(),
    });

    const savedProduct = await this.productRepo.save(product);

    // Create subtype using factory pattern
    const subtypeService = this.productSubtypeFactory.getService(type);
    const idField = this.productSubtypeFactory.getIdField(type);

    await subtypeService.create({
      ...subtypeFields,
      [idField]: savedProduct.product_id,
    });

    return savedProduct;
  }

  async findAll(params: {
    category?: string;
    search?: string;
    maxPrice?: number;
    minPrice?: number;
    sort?: string;
    includeInactive?: boolean;
    limit: number;
  }): Promise<Product[]> {
    const { category, search, maxPrice, minPrice, sort, includeInactive, limit } = params;
    const qb = this.productRepo.createQueryBuilder('product');

    if (!includeInactive) {
      qb.andWhere('product.is_active = true');
    }

    if (search) {
      qb.andWhere(
        '(LOWER(product.title) LIKE LOWER(:search) OR LOWER(product.category) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    if (category && category !== 'all') {
      // Assuming 'type' column stores 'book', 'cd', etc. matching filter categories
      // Or 'category' column depending on usage. Based on entity, 'type' is enum-like, 'category' is string.
      // Let's search both or stick to type if frontend sends type.
      // Frontend uses 'type' usually (book, cd, dvd).
      qb.andWhere('product.type = :category', { category });
    }

    if (minPrice !== undefined) {
      qb.andWhere('product.current_price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      qb.andWhere('product.current_price <= :maxPrice', { maxPrice });
    }

    if (sort === 'price_asc') {
      qb.orderBy('product.current_price', 'ASC');
    } else if (sort === 'random') {
      qb.orderBy('RANDOM()');
    } else if (sort === 'newest') {
      qb.orderBy('product.creation_date', 'DESC');
    } else if (sort === 'price_desc') {
      qb.orderBy('product.current_price', 'DESC');
    } else {
      // Default sort
      qb.orderBy('product.title', 'ASC');
    }

    qb.take(limit);

    return await qb.getMany();
  }

  private generateChangeDescription(
    oldData: any,
    updateDto: UpdateFullProductDto,
  ): string {
    const changes: string[] = [];
    const { subtypeFields, ...baseFields } = updateDto;

    // Check changes in base fields
    Object.keys(baseFields).forEach((key) => {
      if (
        key !== 'type' &&
        oldData[key] !== undefined &&
        baseFields[key] !== undefined &&
        oldData[key] !== baseFields[key]
      ) {
        changes.push(`${key}: ${oldData[key]} ---> ${baseFields[key]}`);
      }
    });

    // Check changes in subtype fields
    if (subtypeFields) {
      Object.keys(subtypeFields).forEach((key) => {
        if (
          oldData[key] !== undefined &&
          subtypeFields[key] !== undefined &&
          oldData[key] !== subtypeFields[key]
        ) {
          changes.push(`${key}: ${oldData[key]} ---> ${subtypeFields[key]}`);
        }
      });
    }

    return changes.join(', ');
  }

  private async recordEditHistory(
    productId: number,
    oldCompleteData: Product & Record<string, unknown>,
    updateDto: UpdateFullProductDto,
  ): Promise<void> {
    const changeDescription = this.generateChangeDescription(
      oldCompleteData,
      updateDto,
    );

    // Only create edit history if there are actual changes
    if (changeDescription) {
      await this.editHistoryService.create({
        product_id: productId,
        action: EditAction.EDIT,
        change_description: changeDescription,
      });
    }
  }

  async update(
    id: number,
    updateDto: UpdateFullProductDto,
  ): Promise<Product & Record<string, unknown>> {
    const { subtypeFields, ...baseFields } = updateDto;

    // Get existing product
    const existingProduct = await this.productRepo.findOne({
      where: { product_id: id },
    });

    if (!existingProduct) {
      throw new BadRequestException(`Product with id ${id} not found`);
    }

    // Get full old data (including subtype data) before update
    const oldCompleteData = await this.findOne(id);
    if (!oldCompleteData) {
      throw new BadRequestException(`Product with id ${id} not found`);
    }

    // Validation using dedicated validator
    await this.productValidator.validateUpdate(id, updateDto);

    // Business rules validation using dedicated service
    await this.productBusinessRules.checkEditLimits(
      id,
      existingProduct.manager_id,
    );

    if (baseFields.current_price !== undefined) {
      this.productBusinessRules.validatePriceRange(
        baseFields.current_price,
        existingProduct.value,
      );
    }

    // Update base product (exclude type field to avoid type conflicts)
    const { type, ...updateFields } = baseFields;
    if (Object.keys(updateFields).length > 0) {
      await this.productRepo.update({ product_id: id }, updateFields);
    }

    // Update subtype if needed using factory
    if (subtypeFields && Object.keys(subtypeFields).length > 0) {
      const subtypeService = this.productSubtypeFactory.getService(
        existingProduct.type as ProductType,
      );
      await subtypeService.update(id, subtypeFields);
    }

    // Record edit history with complete old data and new data
    await this.recordEditHistory(id, oldCompleteData, updateDto);

    // Increment manager edit count
    await this.userService.incrementEditCount(existingProduct.manager_id);

    const result = await this.findOne(id);
    if (!result) {
      throw new BadRequestException(
        `Product with id ${id} not found after update`,
      );
    }
    return result;
  }

  async deleteMultiple(deleteProductsDto: DeleteProductsDto) {
    const { productIds } = deleteProductsDto;

    // Get products to be deleted
    const products = await this.productRepo.find({
      where: { product_id: In(productIds) },
    });

    if (products.length === 0) {
      throw new BadRequestException('Không tìm thấy sản phẩm nào để xóa');
    }

    // Validation using dedicated validator
    await this.productValidator.validateDelete(productIds);

    // Business rules validation using dedicated service
    await this.productBusinessRules.checkDeleteLimits(products);

    // Perform deletion using dedicated cascade deletion service
    return this.cascadeDeletionService.deleteProducts(
      products,
      this.productSubtypeFactory,
    );
  }
}
