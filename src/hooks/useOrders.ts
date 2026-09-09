import { useQuery } from '@powersync/react';
import type { Database } from '@/lib/powersync/AppSchema';

export function useOrders() {
  const { data: orders, isLoading, error } = useQuery<Database['orders']>(
    'SELECT * FROM orders ORDER BY created_at DESC'
  );
  return { orders: orders ?? [], isLoading, error };
}

export function useOrderItems(orderId: string | null) {
  const { data: items } = useQuery<Database['order_items']>(
    'SELECT * FROM order_items WHERE order_id = ?',
    orderId ? [orderId] : ['__none__']
  );
  return { items: items ?? [] };
}

export const ORDER_STATUSES = ['pending', 'confirmed', 'delivered', 'cancelled'] as const;
