import { Controller, Post, Get, Body } from '@nestjs/common';
import { FeeCalculationService } from './fee-calculation.service';
import { CalculateFeeDto } from './dto/calculate-fee.dto';

@Controller('fee-calculation')
export class FeeCalculationController {
  constructor(
    private readonly feeCalculationService: FeeCalculationService,
  ) {}

  @Post('calculate')
  calculateFee(@Body() dto: CalculateFeeDto) {
    return this.feeCalculationService.calculateFee(
      {
        items: dto.items,
        province: dto.province,
        subtotal: dto.subtotal,
      },
      dto.strategyName || 'WEIGHT_BASED',
    );
  }

  @Get('strategies')
  getStrategies() {
    return {
      strategies: this.feeCalculationService.getAvailableStrategies(),
    };
  }
}
