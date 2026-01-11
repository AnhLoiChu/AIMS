import { Controller } from '@nestjs/common';
import { Crud, CrudController } from '@dataui/crud';
import { ManagerService } from './manager.service';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateManagerDto } from './dto/update-manager.dto';
import { User } from '../user/entities/user.entity';
export class ManagerEntity extends User {
  // Additional properties specific to Manager can be added here if needed
}

@Crud({
  model: {
    type: ManagerEntity,
  },
  dto: {
    create: CreateManagerDto,
    update: UpdateManagerDto,
  },
  params: {
    user_id: {
      field: 'user_id',
      type: 'number',
      primary: true,
    },
  },
  query: {
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
        value: 'manager',
      },
    ],
  },
})
@Controller('manager')
export class ManagerController implements CrudController<User> {
  constructor(public service: ManagerService) {}
}
