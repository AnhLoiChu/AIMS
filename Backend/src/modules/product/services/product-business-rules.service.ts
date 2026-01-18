import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository, Between } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EditAction, EditHistory } from '../../edit-history/entities/edit-history.entity';
import { Product } from '../entities/product.entity';
import { IProductBusinessRules } from '../interfaces/product-business-rules.interface';
import { UserService } from '../../user/user.service';
import { EDIT_LIMITS } from '../../../constants/edit-limits.constants';

@Injectable()
export class ProductBusinessRulesService implements IProductBusinessRules {
  constructor(
    @InjectRepository(EditHistory)
    private readonly editHistoryRepo: Repository<EditHistory>,
    private readonly userService: UserService,
  ) { }

  validatePriceRange(currentPrice: number, productValue: number): void {
    const maxPrice = productValue * EDIT_LIMITS.MAX_PRICE_PERCENTAGE;
    const minPrice = productValue * EDIT_LIMITS.MIN_PRICE_PERCENTAGE;

    if (currentPrice < minPrice || currentPrice > maxPrice) {
      throw new BadRequestException(
        `Giá hiện tại phải nằm trong khoảng ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)} (${EDIT_LIMITS.MIN_PRICE_PERCENTAGE * 100}-${EDIT_LIMITS.MAX_PRICE_PERCENTAGE * 100}% của giá trị sản phẩm)`,
      );
    }
  }

  async checkEditLimits(productId: number, managerId: number): Promise<void> {
    const [managerEditCount, productEditCount] = await Promise.all([
      this.userService.getManagerEditCountToday(managerId),
      this.getProductEditCountToday(productId),
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
      const currentDeleteCount = await this.userService.getManagerDeleteCountToday(managerId);
      const managerProductsToDelete = products.filter(p => p.manager_id === managerId).length;

      if (currentDeleteCount + managerProductsToDelete > EDIT_LIMITS.MAX_MANAGER_DELETES_PER_DAY) {
        throw new BadRequestException(
          `Manager ID ${managerId} đã đạt giới hạn xóa ${EDIT_LIMITS.MAX_MANAGER_DELETES_PER_DAY} sản phẩm trong ngày. Hiện tại: ${currentDeleteCount}, sẽ thêm: ${managerProductsToDelete}`,
        );
      }
    }
  }

  private async getProductEditCountToday(productId: number): Promise<number> {
    const today = new Date();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    return this.editHistoryRepo.count({
      where: {
        action: EditAction.EDIT,
        product_id: productId,
        edit_time: Between(startOfDay, endOfDay),
      },
    });
  }
} 