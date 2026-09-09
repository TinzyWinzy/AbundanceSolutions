export const VAT_RATE = 0.15;

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

/**
 * Offline-safe document numbers. Random suffix keeps collision
 * probability negligible when two admins issue offline simultaneously;
 * the UNIQUE constraint is the server-side backstop.
 */
export function nextInvoiceNumber(date = new Date()): string {
  return `PFI-${dateStamp(date)}-${randomSuffix()}`;
}

export function nextReceiptNumber(date = new Date()): string {
  return `RCT-${dateStamp(date)}-${randomSuffix()}`;
}

export interface LineInput {
  assetId: string | null;
  description: string;
  quantity: number;
  unitPriceUsd: number;
}

export interface InvoiceTotals {
  subtotalUsd: number;
  vatUsd: number;
  totalUsd: number;
  totalZig: number;
}

export function computeTotals(
  lines: LineInput[],
  rateZig: number,
  vatRate = VAT_RATE
): InvoiceTotals {
  const subtotalUsd = round2(lines.reduce((s, l) => s + l.quantity * l.unitPriceUsd, 0));
  const vatUsd = round2(subtotalUsd * vatRate);
  const totalUsd = round2(subtotalUsd + vatUsd);
  const totalZig = round2(totalUsd * rateZig);
  return { subtotalUsd, vatUsd, totalUsd, totalZig };
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface InvoiceShareLine {
  description: string;
  quantity: number;
  unitPriceUsd: number;
}

export interface InvoiceSharePayload {
  invoiceNumber: string;
  customerName: string;
  lines: InvoiceShareLine[];
  totalUsd: number;
  totalZig: number;
  validUntil: string | null;
}

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? '263719450765';

/**
 * Shares a pro-forma invoice summary over the WhatsApp bridge so the
 * customer receives it on zero-rated social data.
 */
export function buildInvoiceWhatsAppUrl(payload: InvoiceSharePayload): string {
  const lines = payload.lines
    .map((l) => `- ${l.description} x${l.quantity} @ $${l.unitPriceUsd.toFixed(2)}`)
    .join('\n');

  const text =
    `Pro-Forma Invoice ${payload.invoiceNumber}\n` +
    `Customer: ${payload.customerName}\n${lines}\n` +
    `Total USD: $${payload.totalUsd.toFixed(2)}\n` +
    `Total ZiG: ${payload.totalZig.toFixed(2)}` +
    (payload.validUntil ? `\nValid until: ${payload.validUntil}` : '');

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function openInvoiceWhatsApp(payload: InvoiceSharePayload): void {
  window.open(buildInvoiceWhatsAppUrl(payload), '_blank', 'noopener,noreferrer');
}
