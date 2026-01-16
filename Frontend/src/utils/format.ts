/**
 * Format a number to Vietnamese Dong (VND) currency format
 * @param amount - Number to format
 * @returns Formatted string like "25.000 VND"
 */
export const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' VND';
};

/**
 * Format a number to Vietnamese Dong short format (for display in tables)
 * @param amount - Number to format
 * @returns Formatted string like "25.000đ"
 */
export const formatVNDShort = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + 'đ';
};
