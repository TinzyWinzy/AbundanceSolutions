import type { InventoryAsset } from '@/lib/powersync/AppSchema';
import { EmptyState } from '@/components/ui/States';
import { ProductCard } from './ProductCard';

export function ProductGrid({ assets }: { assets: InventoryAsset[] }) {
  if (assets.length === 0) {
    return <EmptyState title="No equipment found" message="Check back soon or clear your filters." />;
  }

  return (
    <div className="product-grid">
      {assets.map((asset) => (
        <ProductCard key={asset.id} asset={asset} />
      ))}
    </div>
  );
}
