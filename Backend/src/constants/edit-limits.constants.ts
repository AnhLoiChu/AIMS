// Edit limits constants for product management
export const EDIT_LIMITS = {
  // Maximum number of times a product can be edited per day
  MAX_PRODUCT_EDITS_PER_DAY: 5,

  // Maximum number of times a manager can edit products per day
  MAX_MANAGER_EDITS_PER_DAY: 5,

  // Maximum number of times a manager can delete products per day
  MAX_MANAGER_DELETES_PER_DAY: 30,

  // Maximum number of products that can be deleted in a single operation
  MAX_PRODUCTS_DELETE_AT_ONCE: 10,

  // Price validation limits (percentage of product value)
  MIN_PRICE_PERCENTAGE: 0.3,
  MAX_PRICE_PERCENTAGE: 1.5,
} as const;

// Type for better TypeScript support
export type EditLimits = typeof EDIT_LIMITS;
