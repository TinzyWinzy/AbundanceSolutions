import { usePowerSync } from '@powersync/react';
import { useMemo, useState } from 'react';
import type { InventoryAsset, Order } from '@/lib/powersync/AppSchema';
import { createInvoice, deliverOrder, updateOrderStatus } from '@/lib/powersync/mutations';
import { toast } from '@/lib/toast';
import { useAuth } from '@/hooks/useAuth';
import { useLatestRate } from '@/hooks/useInvoices';
import { ORDER_STATUSES, useOrderItems, useOrders } from '@/hooks/useOrders';
import { nextInvoiceNumber } from '@/utils/invoices';
import { formatDate, formatUSD } from '@/utils/format';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, RowsSkeleton } from '@/components/ui/States';

const VAT_RATE = 0.15;

export function Orders({
  assets,
  onInvoiced
}: {
  assets: InventoryAsset[];
  onInvoiced: () => void;
}) {
  const { orders, isLoading } = useOrders();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const openCount = orders.filter((o) => o.status === 'pending').length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter && (o.status ?? '') !== statusFilter) return false;
      if (!q) return true;
      return (
        (o.reference ?? '').toLowerCase().includes(q) ||
        (o.customer_name ?? '').toLowerCase().includes(q) ||
        (o.customer_phone ?? '').replace(/\D/g, '').includes(q.replace(/\D/g, ''))
      );
    });
  }, [orders, query, statusFilter]);

  return (
    <div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 12px' }}>
        {openCount} pending order{openCount === 1 ? '' : 's'} · {orders.length} total
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <Input
          type="search"
          placeholder="Search reference, customer, phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search orders"
          style={{ flex: 1 }}
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          style={{ width: 'auto' }}
        >
          <option value="">All</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <RowsSkeleton rows={5} cols={5} />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          message="Web checkout orders appear here once customers place them."
        />
      ) : visible.length === 0 ? (
        <EmptyState title="No matches" message="Try a different search or status." />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Placed</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setSelectedId(order.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ fontWeight: 600 }}>{order.reference ?? '—'}</td>
                  <td>{order.customer_name}</td>
                  <td>{formatUSD(order.total_usd)}</td>
                  <td>
                    <Badge value={order.status ?? 'pending'} />
                  </td>
                  <td>{formatDate(order.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedId ? (
        <OrderDetailModal
          orderId={selectedId}
          assets={assets}
          onClose={() => setSelectedId(null)}
          onInvoiced={onInvoiced}
        />
      ) : null}
    </div>
  );
}

function OrderDetailModal({
  orderId,
  assets,
  onClose,
  onInvoiced
}: {
  orderId: string;
  assets: InventoryAsset[];
  onClose: () => void;
  onInvoiced: () => void;
}) {
  const db = usePowerSync();
  const { profile, user } = useAuth();
  const { orders } = useOrders();
  const { items } = useOrderItems(orderId);
  const { rate } = useLatestRate();
  const [saving, setSaving] = useState(false);
  const [invoicing, setInvoicing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const order: Order | undefined = orders.find((o) => o.id === orderId);
  if (!order) return null;

  const assetById = new Map(assets.map((a) => [a.id, a]));

  const handleStatus = async (status: string) => {
    setSaving(true);
    setError(null);
    try {
      if (status === 'delivered' && order.status !== 'delivered') {
        // First entry into delivered: decrement stock once, atomically.
        await deliverOrder(
          db,
          order.id,
          items.map((i) => ({ assetId: i.asset_id, quantity: i.quantity ?? 1 }))
        );
      } else {
        await updateOrderStatus(db, order.id, status);
      }
      toast(`Order ${order.reference ?? ''} → ${status}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setSaving(false);
    }
  };

  const handleInvoice = async () => {
    if (!profile || !user) {
      setError('You must be signed in.');
      return;
    }
    if (!rate) {
      setError('Set the day\u2019s exchange rate first (Invoices tab).');
      return;
    }
    setInvoicing(true);
    setError(null);
    try {
      const subtotal =
        Math.round(items.reduce((s, i) => s + (i.quantity ?? 0) * (i.unit_price_usd ?? 0), 0) * 100) / 100;
      await createInvoice(db, {
        organizationId: profile.organization_id,
        userId: user.id,
        invoiceNumber: nextInvoiceNumber(),
        customerName: order.customer_name ?? 'Walk-in customer',
        customerPhone: order.customer_phone ?? '',
        lines: items.map((i) => ({
          assetId: i.asset_id,
          description: assetById.get(i.asset_id ?? '')?.name ?? 'Item',
          quantity: i.quantity ?? 1,
          unitPriceUsd: i.unit_price_usd ?? 0
        })),
        vatUsd: Math.round(subtotal * VAT_RATE * 100) / 100,
        appliedRateZig: rate.official_rate ?? 1,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      toast('Invoice created from order');
      onInvoiced();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice.');
    } finally {
      setInvoicing(false);
    }
  };

  return (
    <Modal open title={order.reference ?? 'Order'} onClose={onClose}>
      <div style={{ fontSize: '0.88rem', marginBottom: 12 }}>
        <div>
          <strong>Customer:</strong> {order.customer_name} · {order.customer_phone}
        </div>
        <div>
          <strong>Placed:</strong> {formatDate(order.created_at)}
        </div>
        <div>
          <strong>Total:</strong> {formatUSD(order.total_usd)}
          {order.total_zig != null
            ? ` · ZiG ${order.total_zig.toLocaleString()}`
            : ''}
        </div>
      </div>

      <div className="table-wrap" style={{ marginBottom: 12 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Unit USD</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td style={{ whiteSpace: 'normal' }}>
                  {assetById.get(i.asset_id ?? '')?.name ?? 'Item'}
                </td>
                <td>{i.quantity}</td>
                <td>{formatUSD(i.unit_price_usd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Status:</span>
        <select
          className="select"
          style={{ width: 'auto', padding: '6px 10px', fontSize: '0.85rem' }}
          value={order.status ?? 'pending'}
          onChange={(e) => handleStatus(e.target.value)}
          disabled={saving}
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error ? <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p> : null}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button onClick={handleInvoice} disabled={invoicing}>
          {invoicing ? 'Creating…' : 'Create invoice'}
        </Button>
        <a
          className="btn btn-secondary"
          href={`https://wa.me/${order.customer_phone}?text=${encodeURIComponent(
            `Hello ${order.customer_name}, this is Abundance Solutions regarding your order ${order.reference ?? ''}.`
          )}`}
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp customer
        </a>
      </div>
    </Modal>
  );
}
