import { supabase } from '@/lib/supabase/client';

export interface CheckoutLine {
  assetId: string;
  quantity: number;
}

export interface CheckoutResult {
  orderId: string;
  reference: string;
  totalUsd: number;
  totalZig: number | null;
  appliedRate: number | null;
}

/**
 * Places a public order via the `checkout` Edge Function.
 * Works signed-out (anon key): prices are re-priced server-side from the DB,
 * so client totals are never trusted. Throws with a readable message.
 */
export async function submitOrder(input: {
  customerName: string;
  customerPhone: string;
  lines: CheckoutLine[];
}): Promise<CheckoutResult> {
  const { data, error } = await supabase.functions.invoke('checkout', {
    body: {
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      lines: input.lines.map((l) => ({ assetId: l.assetId, quantity: l.quantity }))
    }
  });

  if (error) {
    throw new Error('Checkout failed. Please try again.');
  }

  const result = data as Partial<CheckoutResult> & { error?: string };
  if (!result || result.error || !result.orderId || !result.reference) {
    throw new Error(result?.error ?? 'Checkout failed. Please try again.');
  }

  return {
    orderId: result.orderId,
    reference: result.reference,
    totalUsd: result.totalUsd ?? 0,
    totalZig: result.totalZig ?? null,
    appliedRate: result.appliedRate ?? null
  };
}
