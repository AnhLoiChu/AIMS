import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Role])], // Importing TypeOrmModule with Role entity
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService, TypeOrmModule], // Exporting RoleService and TypeOrmModule for use in other modules
})
export class RoleModule {}
