import { Injectable, BadRequestException } from '@nestjs/common';
import {
  IFeeCalculationStrategy,
  FeeCalculationContext,
  FeeCalculationResult,
} from './interfaces/fee-calculation-strategy.interface';
import { WeightBasedFeeStrategy } from './strategies/weight-based-fee.strategy';
import { VolumeBasedFeeStrategy } from './strategies/volume-based-fee.strategy';

@Injectable()
export class FeeCalculationService {
  private strategies: Map<string, IFeeCalculationStrategy> = new Map();

  constructor() {
    // Đăng ký các strategies
    this.registerStrategy(new WeightBasedFeeStrategy());
    this.registerStrategy(new VolumeBasedFeeStrategy());
  }

  registerStrategy(strategy: IFeeCalculationStrategy): void {
    this.strategies.set(strategy.getName(), strategy);
  }

  calculateFee(
    context: FeeCalculationContext,
    strategyName: string = 'WEIGHT_BASED',
  ): FeeCalculationResult {
    const strategy = this.strategies.get(strategyName);

    if (!strategy) {
      throw new BadRequestException(`Strategy ${strategyName} not found`);
    }

    return strategy.calculate(context);
  }

  getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }
}
