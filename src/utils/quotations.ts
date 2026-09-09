const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? '263719450765';

export const QUOTE_VAT_RATE = 0.15;

function randomSuffix(length = 4): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

function dateStamp(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/** Client-side quotation number. Non-binding: a formal PFI is issued by staff. */
export function nextQuoteNumber(date = new Date()): string {
  return `QTE-${dateStamp(date)}-${randomSuffix()}`;
}

export interface QuoteLine {
  description: string;
  quantity: number;
  unitPriceUsd: number | null;
}

export interface QuoteTotals {
  subtotalUsd: number;
  vatUsd: number;
  totalUsd: number;
  totalZig: number;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeQuoteTotals(
  lines: QuoteLine[],
  rateZig: number | null,
  vatRate = QUOTE_VAT_RATE
): QuoteTotals {
  const subtotalUsd = round2(
    lines.reduce((s, l) => s + l.quantity * (l.unitPriceUsd ?? 0), 0)
  );
  const vatUsd = round2(subtotalUsd * vatRate);
  const totalUsd = round2(subtotalUsd + vatUsd);
  const totalZig = rateZig != null ? round2(totalUsd * rateZig) : 0;
  return { subtotalUsd, vatUsd, totalUsd, totalZig };
}

export interface QuoteSharePayload {
  quoteNumber: string;
  customerName: string | null;
  lines: QuoteLine[];
  totals: QuoteTotals;
  validUntil: string;
  hasUnpricedLines: boolean;
}

export function buildQuoteWhatsAppUrl(payload: QuoteSharePayload): string {
  const lines = payload.lines
    .map(
      (l) =>
        `- ${l.description} x${l.quantity}` +
        (l.unitPriceUsd != null ? ` @ $${l.unitPriceUsd.toFixed(2)}` : ' (TBC)')
    )
    .join('\n');

  const text =
    `Quotation ${payload.quoteNumber}` +
    (payload.customerName ? ` for ${payload.customerName}` : '') +
    `\n${lines}\nSubtotal: $${payload.totals.subtotalUsd.toFixed(2)}` +
    `\nVAT (15%): $${payload.totals.vatUsd.toFixed(2)}` +
    `\nTotal: $${payload.totals.totalUsd.toFixed(2)}` +
    (payload.totals.totalZig > 0 ? ` (ZiG ${payload.totals.totalZig.toLocaleString()})` : '') +
    `\nValid until: ${payload.validUntil}` +
    (payload.hasUnpricedLines ? `\nNote: TBC lines priced on confirmation.` : '') +
    `\nPlease confirm availability.`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function openQuoteWhatsApp(payload: QuoteSharePayload): void {
  window.open(buildQuoteWhatsAppUrl(payload), '_blank', 'noopener,noreferrer');
}
