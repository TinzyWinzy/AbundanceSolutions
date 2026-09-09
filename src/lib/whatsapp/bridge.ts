const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? '263719450765';

export interface CartLine {
  name: string;
  quantity: number;
  unitPriceUsd: number | null;
  unitPriceZig: number | null;
}

export interface OrderPayload {
  lines: CartLine[];
  totalUsd: number;
  totalZig: number;
  reference?: string;
  customerName?: string;
}

function formatMoney(amount: number | null, symbol: string): string {
  if (amount == null || Number.isNaN(amount)) return '';
  return `${symbol}${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

/**
 * Serializes a cart into a pre-encoded wa.me URL so the checkout can be
 * completed over zero-rated WhatsApp social data bundles.
 */
export function buildWhatsAppCheckoutUrl(payload: OrderPayload): string {
  const lines = payload.lines
    .map(
      (line) =>
        `- ${line.name} x${line.quantity} @ ${formatMoney(line.unitPriceUsd, '$') || formatMoney(line.unitPriceZig, 'ZiG ')}`
    )
    .join('\n');

  const totals = [
    payload.totalUsd > 0 ? `USD: $${payload.totalUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '',
    payload.totalZig > 0 ? `ZiG: ${payload.totalZig.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : ''
  ]
    .filter(Boolean)
    .join(' | ');

  const header = payload.reference
    ? `Order ${payload.reference}${payload.customerName ? ` (${payload.customerName})` : ''}:\n${lines}\nTotal: ${totals}`
    : `Order Summary:\n${lines}\nTotal: ${totals}`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(header)}`;
}

export function openWhatsAppCheckout(payload: OrderPayload): void {
  const url = buildWhatsAppCheckoutUrl(payload);
  window.open(url, '_blank', 'noopener,noreferrer');
}
