import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCatalog } from '@/hooks/useCatalog';
import { useCart } from '@/stores/cart';
import { useUI } from '@/stores/ui';
import { openWhatsAppCheckout } from '@/lib/whatsapp/bridge';
import { formatUSD } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { ErrorState, Spinner } from '@/components/ui/States';
import { ProductCard } from '@/components/showroom/ProductCard';

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function parseSpecs(value: string | null): [string, string][] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.entries(parsed).map(([k, v]) => [k, String(v)]);
    }
    return [];
  } catch {
    return [];
  }
}

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { assets, loading, error } = useCatalog(undefined);
  const { bandwidthSaver } = useUI();
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const asset = useMemo(() => assets.find((a) => a.id === id), [assets, id]);

  const images = useMemo(() => {
    if (!asset) return [];
    const fromArray = parseJsonArray(asset.image_urls);
    const all = [asset.thumbnail_url, ...fromArray].filter(
      (x): x is string => typeof x === 'string' && x.length > 0
    );
    return [...new Set(all)];
  }, [asset]);

  const specs = useMemo(() => (asset ? parseSpecs(asset.specifications) : []), [asset]);
  const related = useMemo(() => {
    if (!asset) return [];
    return assets
      .filter((a) => a.id !== asset.id && a.category_id === asset.category_id)
      .slice(0, 4);
  }, [assets, asset]);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} />;
  if (!asset) {
    return (
      <div className="empty-state">
        <h3>Machine not found</h3>
        <p>
          <Link to="/store">Back to the store</Link>
        </p>
      </div>
    );
  }

  const showImage = !bandwidthSaver && images.length > 0;
  const lowStock =
    (asset.min_stock ?? 0) > 0 && (asset.stock_count ?? 0) <= (asset.min_stock ?? 0);

  const handleAdd = () => {
    add({
      assetId: asset.id,
      name: asset.name ?? 'Unnamed item',
      unitPriceUsd: asset.price_usd,
      unitPriceZig: asset.price_zig,
      thumbnailUrl: images[0] ?? null,
      quantity: qty
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  };

  const handleQuickEnquire = () => {
    openWhatsAppCheckout({
      lines: [
        {
          name: asset.name ?? 'Unnamed item',
          quantity: qty,
          unitPriceUsd: asset.price_usd,
          unitPriceZig: asset.price_zig
        }
      ],
      totalUsd: (asset.price_usd ?? 0) * qty,
      totalZig: (asset.price_zig ?? 0) * qty
    });
  };

  return (
    <div>
      <p style={{ fontSize: '0.85rem', margin: '0 0 12px' }}>
        <Link to="/store">← Back to store</Link>
      </p>

      <div
        style={{ display: 'grid', gap: 20, alignItems: 'start' }}
        className="detail-layout"
      >
        <div
          className="card"
          style={{
            aspectRatio: '4/3',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: showImage ? '#0f172a' : 'var(--surface-2)'
          }}
        >
          {showImage ? (
            <img
              src={images[0]}
              alt={asset.name ?? 'Equipment'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: '3rem' }}>🏗️</span>
          )}
        </div>

        <div>
          <StatusBadge status={asset.status ?? 'available'} />
          <h1 style={{ margin: '8px 0', fontSize: '1.6rem' }}>{asset.name}</h1>

          <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginBottom: 4 }}>
            {asset.price_usd != null && (
              <strong style={{ color: 'var(--primary)', fontSize: '1.4rem' }}>
                {formatUSD(asset.price_usd)}
              </strong>
            )}
            {asset.price_zig != null && (
              <span style={{ color: 'var(--text-muted)' }}>
                ZiG {asset.price_zig.toLocaleString()}
              </span>
            )}
          </div>
          {asset.price_usd == null && asset.price_zig == null && (
            <p style={{ color: 'var(--text-muted)' }}>Price on enquiry.</p>
          )}

          <p style={{ fontSize: '0.9rem' }}>
            {lowStock ? (
              <strong style={{ color: 'var(--danger)' }}>
                Only {asset.stock_count} left in stock.
              </strong>
            ) : (
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>In stock</span>
            )}
          </p>

          {asset.description ? <p>{asset.description}</p> : null}

          {specs.length > 0 ? (
            <dl style={{ fontSize: '0.9rem' }}>
              {specs.map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 8, padding: '4px 0' }}>
                  <dt style={{ color: 'var(--text-muted)', minWidth: 120 }}>{k}</dt>
                  <dd style={{ margin: 0, fontWeight: 600 }}>{v}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '16px 0' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 800 }}>{qty}</span>
            <button
              className="btn btn-secondary"
              onClick={() => setQty((q) => Math.min(99, q + 1))}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button onClick={handleAdd} style={{ flex: 1, minWidth: 160 }}>
              {added ? '✓ Added' : 'Add to enquiry'}
            </Button>
            <Button variant="secondary" onClick={handleQuickEnquire}>
              WhatsApp enquire
            </Button>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 10 }}>
            Checkout saves your order with a reference number before opening WhatsApp.
          </p>
        </div>
      </div>

      {related.length > 0 ? (
        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: '1.2rem' }}>Related machines</h2>
          <div className="product-grid">
            {related.map((a) => (
              <ProductCard key={a.id} asset={a} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
