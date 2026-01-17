import {
  IFeeCalculationStrategy,
  FeeCalculationContext,
  FeeCalculationResult,
} from '../interfaces/fee-calculation-strategy.interface';

export class WeightBasedFeeStrategy implements IFeeCalculationStrategy {
  getName(): string {
    return 'WEIGHT_BASED';
  }

  calculate(context: FeeCalculationContext): FeeCalculationResult {
    const isHanoiOrHCM = [
      'thanh_pho_ha_noi',
      'thanh_pho_ho_chi_minh',
      'HN',
      'HCM',
    ].includes(context.province);

    // Tính tổng trọng lượng
    const totalWeight = context.items.reduce(
      (sum, item) => sum + item.product.weight * item.quantity,
      0,
    );

    let baseFee = 0;
    let additionalFee = 0;

    if (isHanoiOrHCM) {
      baseFee = 22000;
      if (totalWeight > 3) {
        additionalFee = Math.ceil((totalWeight - 3) / 0.5) * 2500;
      }
    } else {
      baseFee = 30000;
      if (totalWeight > 0.5) {
        additionalFee = Math.ceil((totalWeight - 0.5) / 0.5) * 2500;
      }
    }

    const originalFee = baseFee + additionalFee;
    let discount = 0;

    // Miễn phí vận chuyển cho đơn > 100,000 VND (tối đa 25,000 VND)
    if (context.subtotal > 100000) {
      discount = Math.min(25000, originalFee);
    }

    const finalFee = Math.max(0, originalFee - discount);

    return {
      baseFee,
      additionalFee,
      discount,
      finalFee,
      calculationMethod: 'WEIGHT_BASED',
      details: { totalWeight },
    };
  }
}
