export function formatUSD(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '$0.00';
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatZiG(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return 'ZiG 0.00';
  return `ZiG ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatMoney(amount: number | null | undefined, currency: string): string {
  return currency === 'ZiG' ? formatZiG(amount) : formatUSD(amount);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-ZW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function currencySymbol(currency: string): string {
  switch (currency) {
    case 'ZiG':
      return 'ZiG';
    case 'EcoCash':
      return 'EcoCash';
    default:
      return 'USD';
  }
}
