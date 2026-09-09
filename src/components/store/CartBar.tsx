import { Link } from 'react-router-dom';
import { useCart } from '@/stores/cart';
import { formatUSD } from '@/utils/format';

export function CartBar({ onReview }: { onReview: () => void }) {
  const count = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const totalUsd = useCart((s) => s.items.reduce((t, i) => t + (i.unitPriceUsd ?? 0) * i.quantity, 0));

  if (count === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -4px 16px rgba(15, 23, 42, 0.12)',
        padding: '10px 16px calc(10px + env(safe-area-inset-bottom))'
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800 }}>
            {count} item{count === 1 ? '' : 's'} · {formatUSD(totalUsd)}
          </div>
          <button
            onClick={onReview}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--primary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Review enquiry
          </button>
        </div>
        <div style={{ flex: 1 }} />
        <Link to="/checkout" className="btn btn-primary" style={{ padding: '12px 26px' }}>
          Checkout →
        </Link>
      </div>
    </div>
  );
}

export function Skeletons({ count = 6 }: { count?: number }) {
  return (
    <div className="product-grid" aria-label="Loading products">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card" style={{ overflow: 'hidden' }}>
          <div style={{ aspectRatio: '4/3', background: 'var(--surface-2)' }} />
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{ height: 14, borderRadius: 6, background: 'var(--surface-2)', width: '80%' }}
            />
            <div
              style={{ height: 14, borderRadius: 6, background: 'var(--surface-2)', width: '50%' }}
            />
            <div style={{ height: 36, borderRadius: 8, background: 'var(--surface-2)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CartBarSpacer() {
  const count = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  if (count === 0) return null;
  return <div style={{ height: 76 }} aria-hidden />;
}
