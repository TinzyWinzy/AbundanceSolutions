import { openWhatsAppCheckout } from '@/lib/whatsapp/bridge';
import { useCart } from '@/stores/cart';
import { formatUSD } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, remove, setQuantity, clear } = useCart();

  const totalUsd = items.reduce((sum, i) => sum + (i.unitPriceUsd ?? 0) * i.quantity, 0);
  const totalZig = items.reduce((sum, i) => sum + (i.unitPriceZig ?? 0) * i.quantity, 0);

  const handleCheckout = () => {
    openWhatsAppCheckout({
      lines: items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unitPriceUsd: i.unitPriceUsd,
        unitPriceZig: i.unitPriceZig
      })),
      totalUsd,
      totalZig
    });
    clear();
    onClose();
  };

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

          <Button block onClick={handleCheckout}>
            Checkout via WhatsApp
          </Button>
        </>
      )}
    </Modal>
  );
}
