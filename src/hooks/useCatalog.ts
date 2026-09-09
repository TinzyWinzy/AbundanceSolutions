import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Category, InventoryAsset } from '@/lib/powersync/AppSchema';

interface CatalogState {
  categories: Category[];
  assets: InventoryAsset[];
  loading: boolean;
  error: string | null;
}

/**
 * Public catalog for the showroom, served via Supabase REST (anon key).
 * Responses are cached offline by the service worker for low-bandwidth browsing.
 */
export function useCatalog(categorySlug?: string): CatalogState {
  const [categories, setCategories] = useState<Category[]>([]);
  const [assets, setAssets] = useState<InventoryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      const categoriesPromise = supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      let assetsQuery = supabase
        .from('inventory_assets')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (categorySlug) {
        assetsQuery = supabase
          .from('inventory_assets')
          .select('*, categories!inner(slug)')
          .eq('categories.slug', categorySlug)
          .eq('status', 'available')
          .order('created_at', { ascending: false });
      }

      const [{ data: categoriesData, error: categoriesError }, { data: assetsData, error: assetsError }] =
        await Promise.all([categoriesPromise, assetsQuery]);

      if (!active) return;

      if (categoriesError || assetsError) {
        setError((categoriesError ?? assetsError)?.message ?? 'Failed to load catalog');
      } else {
        setCategories((categoriesData as Category[]) ?? []);
        setAssets((assetsData as InventoryAsset[]) ?? []);
      }
      setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [categorySlug]);

  return { categories, assets, loading, error };
}
