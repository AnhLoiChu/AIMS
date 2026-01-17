export interface FeeCalculationContext {
  items: Array<{
    product: {
      weight: number;
      dimensions: string; // format: "length x width x height" (cm)
      value: number;
    };
    quantity: number;
  }>;
  province: string;
  subtotal: number;
}

export interface FeeCalculationResult {
  baseFee: number;
  additionalFee: number;
  discount: number;
  finalFee: number;
  calculationMethod: string;
  details?: any; // Chi tiết tính toán (optional)
}

export interface IFeeCalculationStrategy {
  calculate(context: FeeCalculationContext): FeeCalculationResult;
  getName(): string;
}
