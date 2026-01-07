import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Role } from '../role/entities/role.entity';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { RoleName } from '../role/entities/role.entity';
@Injectable()
export class ManagerService extends TypeOrmCrudService<User> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>, // Optional, for assigning 'manager' role
  ) {
    super(userRepository);
  }

  async createManager(data: Partial<User>): Promise<User> {
    const managerRole = await this.roleRepository.findOne({
      where: { name: RoleName.MANAGER },
    });

    if (!managerRole) {
      throw new Error('Manager role not found');
    }
    const user = this.userRepository.create({
      ...data,
      roles: [managerRole],
    });

    return this.userRepository.save(user);
  }

  // Add similar find, update, or delete methods if needed
}
