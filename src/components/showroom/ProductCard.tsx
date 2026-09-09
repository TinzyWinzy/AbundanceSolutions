import { Link } from 'react-router-dom';
import type { InventoryAsset } from '@/lib/powersync/AppSchema';
import { useCart } from '@/stores/cart';
import { useUI } from '@/stores/ui';
import { formatUSD } from '@/utils/format';
import { Button } from '@/components/ui/Button';

function parseImages(asset: InventoryAsset): string[] {
  if (!asset.image_urls) return [];
  try {
    const parsed = JSON.parse(asset.image_urls);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function ProductCard({ asset }: { asset: InventoryAsset }) {
  const { bandwidthSaver } = useUI();
  const add = useCart((s) => s.add);

  const images = parseImages(asset);
  const image = asset.thumbnail_url ?? images[0] ?? null;
  const showImage = !bandwidthSaver && image;
  const lowStock =
    (asset.min_stock ?? 0) > 0 && (asset.stock_count ?? 0) <= (asset.min_stock ?? 0);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    add({
      assetId: asset.id,
      name: asset.name ?? 'Unnamed item',
      unitPriceUsd: asset.price_usd,
      unitPriceZig: asset.price_zig,
      thumbnailUrl: asset.thumbnail_url ?? images[0] ?? null
    });
  };

  return (
    <Link
      to={`/store/${asset.id}`}
      className="card"
      style={{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        color: 'inherit',
        position: 'relative'
      }}
    >
      {lowStock ? (
        <span
          className="badge"
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 1,
            background: 'var(--danger)',
            color: '#fff'
          }}
        >
          Only {asset.stock_count} left
        </span>
      ) : null}
      <div
        style={{
          aspectRatio: '4/3',
          background: showImage ? '#0f172a' : 'var(--surface-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          overflow: 'hidden'
        }}
      >
        {showImage ? (
          <img
            src={image ?? undefined}
            alt={asset.name ?? 'Equipment'}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: '2rem' }}>🏗️</span>
        )}
      </div>

      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.3 }}>{asset.name}</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
          {asset.price_usd != null && (
            <strong style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>
              {formatUSD(asset.price_usd)}
            </strong>
          )}
          {asset.price_zig != null && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              ZiG {asset.price_zig.toLocaleString()}
            </span>
          )}
        </div>
        <Button variant="secondary" style={{ marginTop: 'auto' }} onClick={handleAdd}>
          Add to enquiry
        </Button>
      </div>
    </Link>
  );
}
