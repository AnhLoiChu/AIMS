import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EditHistoryService } from './edit-history.service';
import { EditHistoryController } from './edit-history.controller';
import { EditHistory } from './entities/edit-history.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EditHistory, User])],
  controllers: [EditHistoryController],
  providers: [EditHistoryService],
  exports: [EditHistoryService],
})
export class EditHistoryModule {}
