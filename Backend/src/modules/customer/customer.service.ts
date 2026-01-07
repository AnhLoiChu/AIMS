import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Role } from '../role/entities/role.entity';
import { RoleName } from '../role/entities/role.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
@Injectable()
export class CustomerService extends TypeOrmCrudService<User> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {
    super(userRepository);
  }
  async createOneCustomer(dto: CreateCustomerDto): Promise<User> {
    const customerRole = await this.roleRepository.findOne({
      where: { name: RoleName.CUSTOMER },
    });

    if (!customerRole) {
      throw new Error('Customer role not found');
    }

    const user = this.userRepository.create({
      ...dto,
      roles: [customerRole],
    });

    return this.userRepository.save(user);
  }
}
