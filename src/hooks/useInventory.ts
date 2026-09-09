import { useQuery } from '@powersync/react';
import type { Database } from '@/lib/powersync/AppSchema';

/**
 * Reactive inventory query against the local PowerSync SQLite database.
 * Updates automatically as synced data changes. No network round-trip..
 */
export function useInventory() {
  const { data: assets, isLoading, error } = useQuery<Database['inventory_assets']>(
    'SELECT * FROM inventory_assets ORDER BY updated_at DESC'
  );

  return { assets: assets ?? [], isLoading, error };
}

export function useLowStock() {
  const { data: lowStock } = useQuery<Database['inventory_assets']>(
    'SELECT * FROM inventory_assets WHERE stock_count <= min_stock AND min_stock > 0 ORDER BY stock_count ASC'
  );

  return { lowStock: lowStock ?? [] };
}

export function useSites() {
  const { data: sites } = useQuery<Database['sites']>('SELECT * FROM sites ORDER BY name ASC');
  return { sites: sites ?? [] };
}

export function useCategories() {
  const { data: categories } = useQuery<Database['categories']>(
    'SELECT * FROM categories ORDER BY sort_order ASC'
  );
  return { categories: categories ?? [] };
}
