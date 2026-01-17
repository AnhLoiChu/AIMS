import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Role } from '../role/entities/role.entity';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { RoleName } from '../role/entities/role.entity';
import { CrudRequest } from '@dataui/crud';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ManagerService extends TypeOrmCrudService<User> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {
    super(userRepository);
  }

  // Override createOne to assign manager role automatically
  async createOne(req: CrudRequest, dto: Partial<User>): Promise<User> {
    const managerRole = await this.roleRepository.findOne({
      where: { name: RoleName.MANAGER },
    });

    if (!managerRole) {
      throw new Error('Manager role not found');
    }

    // Hash password if provided
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    const user = this.userRepository.create({
      ...dto,
      roles: [managerRole],
    });

    return this.userRepository.save(user);
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
}
