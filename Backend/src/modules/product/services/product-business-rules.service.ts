import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Product } from '../entities/product.entity';
import { EditHistory, EditAction } from '../../edit-history/entities/edit-history.entity';
import { UserService } from '../../user/user.service';
import { IProductBusinessRules } from '../interfaces/product-business-rules.interface';
import { EDIT_LIMITS } from '../../../constants/edit-limits.constants';

@Injectable()
export class ProductBusinessRulesService implements IProductBusinessRules {
  constructor(
    private readonly userService: UserService,
    @InjectRepository(EditHistory)
    private readonly editHistoryRepo: Repository<EditHistory>,
  ) {}

  async checkEditLimits(productId: number, managerId: number): Promise<void> {
    const [productEditCount, managerEditCount] = await Promise.all([
      this.getProductEditCountToday(productId),
      this.userService.getManagerEditCountToday(managerId),
    ]);

    if (productEditCount >= EDIT_LIMITS.MAX_PRODUCT_EDITS_PER_DAY) {
      throw new BadRequestException(
        `Sản phẩm chỉ được chỉnh sửa tối đa ${EDIT_LIMITS.MAX_PRODUCT_EDITS_PER_DAY} lần trong một ngày`,
      );
    }

    if (managerEditCount >= EDIT_LIMITS.MAX_MANAGER_EDITS_PER_DAY) {
      throw new BadRequestException(
        `Manager chỉ được chỉnh sửa tối đa ${EDIT_LIMITS.MAX_MANAGER_EDITS_PER_DAY} lần trong một ngày`,
      );
    }
  }

  async checkDeleteLimits(products: Product[]): Promise<void> {
    const managerIds = [...new Set(products.map(p => p.manager_id))];
    
    for (const managerId of managerIds) {
      const managerProductsToDelete = products.filter(p => p.manager_id === managerId).length;
      const currentDeleteCount = await this.userService.getManagerDeleteCountToday(managerId);

      if (currentDeleteCount + managerProductsToDelete > EDIT_LIMITS.MAX_MANAGER_DELETES_PER_DAY) {
        throw new BadRequestException(
          `Manager ID ${managerId} đã đạt giới hạn xóa ${EDIT_LIMITS.MAX_MANAGER_DELETES_PER_DAY} sản phẩm trong ngày. Hiện tại: ${currentDeleteCount}, sẽ thêm: ${managerProductsToDelete}`,
        );
      }
    }
  }

  validatePriceRange(currentPrice: number, productValue: number): void {
    const minPrice = productValue * EDIT_LIMITS.MIN_PRICE_PERCENTAGE;
    const maxPrice = productValue * EDIT_LIMITS.MAX_PRICE_PERCENTAGE;

    if (currentPrice < minPrice || currentPrice > maxPrice) {
      throw new BadRequestException(
        `Giá hiện tại phải nằm trong khoảng ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)} (${EDIT_LIMITS.MIN_PRICE_PERCENTAGE * 100}-${EDIT_LIMITS.MAX_PRICE_PERCENTAGE * 100}% của giá trị sản phẩm)`,
      );
    }
  }

  private async getProductEditCountToday(productId: number): Promise<number> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    return this.editHistoryRepo.count({
      where: {
        product_id: productId,
        action: EditAction.EDIT,
        edit_time: Between(startOfDay, endOfDay),
      },
    });
  }
} 