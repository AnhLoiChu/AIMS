import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { RoleModule } from '../role/role.module'; // Required if you inject RoleService
import { UserCounterResetScheduler } from './schedulers/user-counter-reset.scheduler';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    RoleModule,
    ScheduleModule.forRoot(), // Enable scheduling
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserCounterResetScheduler, // Add the scheduler
  ],
  exports: [UserService, TypeOrmModule], // Make UserService available to other modules
})
export class UserModule {}
