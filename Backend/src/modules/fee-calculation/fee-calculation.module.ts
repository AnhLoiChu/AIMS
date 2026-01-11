import { Module } from '@nestjs/common';
import { FeeCalculationController } from './fee-calculation.controller';
import { FeeCalculationService } from './fee-calculation.service';

@Module({
  controllers: [FeeCalculationController],
  providers: [FeeCalculationService],
  exports: [FeeCalculationService],
})
export class FeeCalculationModule {}
