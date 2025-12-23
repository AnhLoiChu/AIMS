export enum OrderStatus {
  PLACING = 'Waiting for Payment',
  PENDING = 'Waiting for Approval',
  ACCEPTED = 'Shipping',
  REJECTED = 'Cancelled',
  COMPLETED = 'Delivered',
}
