import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EditHistory, EditAction } from './entities/edit-history.entity';
import { CreateEditHistoryDto } from './dto/create-edit-history.dto';
import { User } from '../user/entities/user.entity';

@Injectable()
export class EditHistoryService {
  constructor(
    @InjectRepository(EditHistory)
    private readonly editHistoryRepository: Repository<EditHistory>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(
    createEditHistoryDto: CreateEditHistoryDto,
  ): Promise<EditHistory> {
    const editHistory = this.editHistoryRepository.create(createEditHistoryDto);
    return this.editHistoryRepository.save(editHistory);
  }

  async getProductEditCountToday(productId: number): Promise<number> {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1,
    );

    return this.editHistoryRepository.count({
      where: {
        product_id: productId,
        action: EditAction.EDIT,
        edit_time: Between(startOfDay, endOfDay),
      },
    });
  }

  async getManagerEditCountToday(managerId: number): Promise<number> {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1,
    );

    return this.editHistoryRepository
      .createQueryBuilder('editHistory')
      .innerJoin('editHistory.product', 'product')
      .where('product.manager_id = :managerId', { managerId })
      .andWhere('editHistory.action = :action', { action: EditAction.EDIT })
      .andWhere('editHistory.edit_time BETWEEN :startOfDay AND :endOfDay', {
        startOfDay,
        endOfDay,
      })
      .getCount();
  }

  async getManagerDeleteCountToday(managerId: number): Promise<number> {
    // Read delete_count directly from user table
    // This count is reset to 0 daily by the scheduler
    const user = await this.userRepository.findOne({
      where: { user_id: managerId },
      select: ['delete_count'],
    });

    return user ? user.delete_count : 0;
  }
}
