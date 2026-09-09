import { useQuery } from '@powersync/react';
import type { Database } from '@/lib/powersync/AppSchema';

export function useInvoices() {
  const { data: invoices, isLoading, error } = useQuery<Database['pro_forma_invoices']>(
    'SELECT * FROM pro_forma_invoices ORDER BY created_at DESC'
  );
  return { invoices: invoices ?? [], isLoading, error };
}

export function useInvoiceLines(invoiceId: string | null) {
  const { data: lines } = useQuery<Database['invoice_line_items']>(
    'SELECT * FROM invoice_line_items WHERE invoice_id = ?',
    invoiceId ? [invoiceId] : ['__none__']
  );
  return { lines: lines ?? [] };
}

export function useInvoiceReceipts(invoiceId: string | null) {
  const { data: receipts } = useQuery<Database['payment_receipts']>(
    'SELECT * FROM payment_receipts WHERE invoice_id = ? ORDER BY created_at ASC',
    invoiceId ? [invoiceId] : ['__none__']
  );
  return { receipts: receipts ?? [] };
}

export function useLatestRate() {
  const { data } = useQuery<Database['exchange_rates']>(
    'SELECT * FROM exchange_rates ORDER BY effective_at DESC LIMIT 1'
  );
  return { rate: data?.[0] ?? null };
}

export function useAllReceipts(limit = 500) {
  const { data: receipts } = useQuery<Database['payment_receipts']>(
    'SELECT * FROM payment_receipts ORDER BY created_at DESC LIMIT ?',
    [limit]
  );
  return { receipts: receipts ?? [] };
}

/** USD-equivalent received across receipts using the invoice's own rate. */
export function receivedUsd(
  receipts: Pick<Database['payment_receipts'], 'amount_paid' | 'currency'>[],
  rateZig: number
): number {
  return receipts.reduce((sum, r) => {
    const amount = r.amount_paid ?? 0;
    return sum + (r.currency === 'ZiG' ? amount / rateZig : amount);
  }, 0);
}
