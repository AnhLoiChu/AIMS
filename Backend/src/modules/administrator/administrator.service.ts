import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../cart/entities/cart.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class AdministratorService {
  constructor(
    @InjectRepository(User)
    private readonly administratorRepository: Repository<User>,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
  ) {
    // constructor logic here if needed
  }
}
