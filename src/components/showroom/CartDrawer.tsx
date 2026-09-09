import { Link } from 'react-router-dom';
import { useCart } from '@/stores/cart';
import { formatUSD } from '@/utils/format';
import { Modal } from '@/components/ui/Modal';

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, remove, setQuantity } = useCart();

  const totalUsd = items.reduce((sum, i) => sum + (i.unitPriceUsd ?? 0) * i.quantity, 0);
  const totalZig = items.reduce((sum, i) => sum + (i.unitPriceZig ?? 0) * i.quantity, 0);

  return (
    <Modal open={open} title="Your enquiry" onClose={onClose}>
      {items.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>
          Your enquiry is empty. Add equipment to build an order summary.
        </p>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map((item) => (
              <div
                key={item.assetId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {formatUSD(item.unitPriceUsd)} × {item.quantity}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '4px 8px' }}
                    onClick={() => setQuantity(item.assetId, item.quantity - 1)}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span style={{ minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '4px 8px' }}
                    onClick={() => setQuantity(item.assetId, item.quantity + 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '4px 8px', color: 'var(--danger)' }}
                    onClick={() => remove(item.assetId)}
                    aria-label="Remove item"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '16px 0',
              borderTop: '1px solid var(--border)',
              marginTop: 16,
              fontWeight: 700
            }}
          >
            <span>Total</span>
            <span>
              {formatUSD(totalUsd)}
              {totalZig > 0 ? ` · ZiG ${totalZig.toLocaleString()}` : ''}
            </span>
          </div>

          <Link to="/checkout" className="btn btn-primary btn-block" onClick={onClose}>
            Continue to checkout →
          </Link>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
            Your order is saved with a reference number before anything opens WhatsApp.
          </p>
        </>
      )}
    </Modal>
  );
}
