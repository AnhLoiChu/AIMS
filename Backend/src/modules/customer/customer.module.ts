import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Role } from '../role/entities/role.entity';
@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  controllers: [CustomerController],
  providers: [CustomerService],
})
export class CustomerModule {}
