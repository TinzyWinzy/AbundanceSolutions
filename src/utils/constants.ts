export const CURRENCIES = ['USD', 'ZiG', 'EcoCash'] as const;

export const TRANSACTION_TYPES = ['sale', 'rental', 'expense', 'adjustment'] as const;

export const PAYMENT_METHODS = ['cash', 'ecocash', 'bank_transfer', 'zig'] as const;

export const ASSET_STATUSES = ['available', 'rented', 'maintenance', 'sold'] as const;

export type Currency = (typeof CURRENCIES)[number];
export type TransactionType = (typeof TRANSACTION_TYPES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type AssetStatus = (typeof ASSET_STATUSES)[number];

export function labelFor(value: string): string {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
