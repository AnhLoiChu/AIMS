import { Controller } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { User } from '../user/entities/user.entity';
import { Crud, CrudController } from '@dataui/crud';

export class CustomerEntity extends User {}
@Crud({
  model: { type: CustomerEntity },
  dto: {
    create: CreateCustomerDto,
    update: UpdateCustomerDto,
  },
  params: {
    user_id: {
      field: 'user_id',
      type: 'number',
      primary: true,
    },
  },
  query: {
    alwaysPaginate: true, // optional
    join: {
      roles: {
        eager: true, // ensure it joins in queries
        alias: 'roles', // needed for WHERE condition
      },
    },
    filter: [
      {
        field: 'roles.name',
        operator: 'eq',
        value: 'customer',
      },
    ],
  },
})
@Controller('customer')
export class CustomerController implements CrudController<User> {
  constructor(public service: CustomerService) {}
}
