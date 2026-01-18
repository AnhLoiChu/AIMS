export enum OrderStatus {
  PENDING = 'Waiting for Approval',
  PLACING = 'Waiting for Payment',
  REJECTED = 'Cancelled',
  ACCEPTED = 'Shipping',
  USER_CANCELLED = 'Cancelled by Customer',
  COMPLETED = 'Delivered',
}
