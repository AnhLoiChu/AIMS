import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { Role } from '../role/entities/role.entity';
import { RoleName } from '../role/entities/role.entity';

@Injectable()
export class UserService extends TypeOrmCrudService<User> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>, // Optional, for assigning roles
  ) {
    super(userRepository);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['roles'], // Eagerly load roles from the join table
    });
  }

  async create(user: Partial<User>): Promise<User> {
    const newUser = this.repo.create(user);
    return this.repo.save(newUser);
  }

  async update(userId: number, user: Partial<User>): Promise<User> {
    await this.repo.update(userId, user);
    const updatedUser = await this.repo.findOneBy({ user_id: userId });
    if (!updatedUser) {
      throw new Error(`User with id ${userId} not found`);
    }
    return updatedUser;
  }
   
  async createWithRole(data: Partial<User>, roleName: RoleName): Promise<User> {
    const role = await this.roleRepository.findOne({
      where: { name: roleName },
    });
    if (!role) {
      throw new Error(`Role '${roleName}' not found`);
    }

    const user = this.userRepository.create({
      ...data,
      roles: [role],
    });

    return this.userRepository.save(user);
  }
  /**
   * Get manager's edit count for today
   */
  async getManagerEditCountToday(managerId: number): Promise<number> {
    const user = await this.userRepository.findOne({
      where: { user_id: managerId },
      select: ['edit_count']
    });
    
    return user ? user.edit_count : 0;
  }

  /**
   * Get manager's delete count for today  
   */
  async getManagerDeleteCountToday(managerId: number): Promise<number> {
    const user = await this.userRepository.findOne({
      where: { user_id: managerId },
      select: ['delete_count']
    });
    
    return user ? user.delete_count : 0;
  }

  /**
   * Increment manager's edit count
   */
  async incrementEditCount(managerId: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { user_id: managerId },
      select: ['edit_count']
    });
    
    if (user) {
      await this.userRepository.update(managerId, {
        edit_count: (user.edit_count || 0) + 1,
      });
    }
  }

  /**
   * Increment manager's delete count
   */
  async incrementDeleteCount(managerId: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { user_id: managerId },
      select: ['delete_count']
    });
    
    if (user) {
      await this.userRepository.update(managerId, {
        delete_count: (user.delete_count || 0) + 1,
      });
    }
  }

  /**
   * Reset edit_count and delete_count for all users to 0
   * This method should be called daily by a cron job
   */
  async resetDailyCounters(): Promise<void> {
    await this.userRepository.update(
      {}, // Update all users
      {
        edit_count: 0,
        delete_count: 0,
      },
    );
  }

  /**
   * Get statistics of user counters for monitoring
   */
  async getCounterStats(): Promise<{
    totalUsers: number;
    usersWithEdits: number;
    usersWithDeletes: number;
    maxEditCount: number;
    maxDeleteCount: number;
  }> {
    const stats = await this.userRepository
      .createQueryBuilder('user')
      .select([
        'COUNT(*) as totalUsers',
        'COUNT(CASE WHEN user.edit_count > 0 THEN 1 END) as usersWithEdits',
        'COUNT(CASE WHEN user.delete_count > 0 THEN 1 END) as usersWithDeletes',
        'MAX(user.edit_count) as maxEditCount',
        'MAX(user.delete_count) as maxDeleteCount',
      ])
      .getRawOne();

    return {
      totalUsers: parseInt(stats.totalUsers),
      usersWithEdits: parseInt(stats.usersWithEdits),
      usersWithDeletes: parseInt(stats.usersWithDeletes),
      maxEditCount: parseInt(stats.maxEditCount) || 0,
      maxDeleteCount: parseInt(stats.maxDeleteCount) || 0,
    };
  }
}
