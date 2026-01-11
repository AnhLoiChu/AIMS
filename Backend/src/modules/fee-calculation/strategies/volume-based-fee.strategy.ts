import {
  IFeeCalculationStrategy,
  FeeCalculationContext,
  FeeCalculationResult,
} from '../interfaces/fee-calculation-strategy.interface';

export class VolumeBasedFeeStrategy implements IFeeCalculationStrategy {
  getName(): string {
    return 'VOLUME_BASED';
  }

  calculate(context: FeeCalculationContext): FeeCalculationResult {
    // Tính tổng thể tích (cm³)
    const totalVolume = context.items.reduce((sum, item) => {
      const dimensions = this.parseDimensions(item.product.dimensions);
      const volume =
        dimensions.length * dimensions.width * dimensions.height;
      return sum + volume * item.quantity;
    }, 0);

    // Chuyển đổi sang m³
    const volumeInM3 = totalVolume / 1000000;

    const isHanoiOrHCM = [
      'thanh_pho_ha_noi',
      'thanh_pho_ho_chi_minh',
      'HN',
      'HCM',
    ].includes(context.province);

    let baseFee = 0;
    let additionalFee = 0;

    if (isHanoiOrHCM) {
      baseFee = 30000;
      if (volumeInM3 > 0.1) {
        // 5,000 VND mỗi 0.05 m³ thêm
        additionalFee = Math.ceil((volumeInM3 - 0.1) / 0.05) * 5000;
      }
    } else {
      baseFee = 40000;
      if (volumeInM3 > 0.05) {
        additionalFee = Math.ceil((volumeInM3 - 0.05) / 0.05) * 5000;
      }
    }

    const originalFee = baseFee + additionalFee;
    let discount = 0;

    if (context.subtotal > 100000) {
      discount = Math.min(25000, originalFee);
    }

    const finalFee = Math.max(0, originalFee - discount);

    return {
      baseFee,
      additionalFee,
      discount,
      finalFee,
      calculationMethod: 'VOLUME_BASED',
      details: { totalVolume, volumeInM3 },
    };
  }

  private parseDimensions(dimensions: string): {
    length: number;
    width: number;
    height: number;
  } {
    const parts = dimensions.split('x').map((p) => parseFloat(p.trim()));
    return {
      length: parts[0] || 0,
      width: parts[1] || 0,
      height: parts[2] || 0,
    };
  }
}
