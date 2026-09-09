import { useStatus } from '@powersync/react';
import { useMemo } from 'react';
import { useLowStock } from '@/hooks/useInventory';
import { receivedUsd, useAllReceipts, useInvoices } from '@/hooks/useInvoices';
import { useOrders } from '@/hooks/useOrders';
import { formatDate, formatUSD } from '@/utils/format';
import { Spinner } from '@/components/ui/States';

export type AdminTab =
  | 'overview'
  | 'inventory'
  | 'logs'
  | 'invoices'
  | 'orders'
  | 'customers'
  | 'team'
  | 'settings';

function startOfTodayUTC(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export function Overview({ onNavigate }: { onNavigate: (tab: AdminTab) => void }) {
  const { orders } = useOrders();
  const { invoices, isLoading } = useInvoices();
  const { receipts } = useAllReceipts();
  const { lowStock } = useLowStock();

  const snapshot = useMemo(() => {
    const nowIso = new Date().toISOString();
    const todayStart = startOfTodayUTC();

    const pendingOrders = orders.filter((o) => o.status === 'pending');

    const openInvoices = invoices.filter((i) =>
      ['issued', 'partially_paid'].includes(i.status ?? '')
    );
    const overdueInvoices = openInvoices.filter(
      (i) => (i.valid_until ?? '') !== '' && (i.valid_until ?? '') < nowIso
    );

    const receiptsByInvoice = new Map<string, typeof receipts>();
    for (const r of receipts) {
      const key = r.invoice_id ?? '';
      if (!key) continue;
      const list = receiptsByInvoice.get(key) ?? [];
      list.push(r);
      receiptsByInvoice.set(key, list);
    }

    let receivablesUsd = 0;
    for (const inv of openInvoices) {
      const rate = inv.applied_rate_zig && inv.applied_rate_zig > 0 ? inv.applied_rate_zig : 1;
      const received = receivedUsd(receiptsByInvoice.get(inv.id) ?? [], rate);
      receivablesUsd += Math.max(0, (inv.total_usd ?? 0) - received);
    }

    const todayByCurrency = new Map<string, number>();
    for (const r of receipts) {
      if ((r.created_at ?? '') >= todayStart) {
        const cur = r.currency ?? 'USD';
        todayByCurrency.set(cur, (todayByCurrency.get(cur) ?? 0) + (r.amount_paid ?? 0));
      }
    }

    return {
      pendingOrders,
      overdueInvoices,
      openInvoices: openInvoices.length,
      receivablesUsd: Math.round(receivablesUsd * 100) / 100,
      todayByCurrency,
      lowStock
    };
  }, [orders, invoices, receipts, lowStock]);

  if (isLoading) return <Spinner />;

  return (
    <div>
      <SyncCard />

      <div style={{ fontWeight: 800, marginBottom: 8 }}>Needs your attention</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12,
          marginBottom: 20
        }}
      >
        <ActionCard
          count={snapshot.pendingOrders.length}
          label="Pending orders"
          sub={
            snapshot.pendingOrders[0]
              ? `Oldest: ${snapshot.pendingOrders[snapshot.pendingOrders.length - 1]?.reference ?? ''}`
              : 'All clear'
          }
          onClick={() => onNavigate('orders')}
        />
        <ActionCard
          count={snapshot.overdueInvoices.length}
          label="Overdue invoices"
          sub={
            snapshot.overdueInvoices.length > 0
              ? `Oldest due ${formatDate(snapshot.overdueInvoices[snapshot.overdueInvoices.length - 1]?.valid_until)}`
              : 'None overdue'
          }
          onClick={() => onNavigate('invoices')}
        />
        <ActionCard
          count={snapshot.lowStock.length}
          label="Low stock items"
          sub={snapshot.lowStock[0]?.name ?? 'Stock healthy'}
          onClick={() => onNavigate('inventory')}
        />
      </div>

      <div style={{ fontWeight: 800, marginBottom: 8 }}>Money today</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12,
          marginBottom: 20
        }}
      >
        {snapshot.todayByCurrency.size === 0 ? (
          <div className="card" style={{ padding: 16, color: 'var(--text-muted)' }}>
            No receipts logged yet today.
          </div>
        ) : (
          [...snapshot.todayByCurrency.entries()].map(([currency, total]) => (
            <div className="card" style={{ padding: 16 }} key={currency}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Collected today ({currency})
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                {currency === 'ZiG'
                  ? `ZiG ${total.toLocaleString()}`
                  : formatUSD(total)}
              </div>
            </div>
          ))
        )}
        <button
          className="card"
          style={{ padding: 16, textAlign: 'left', cursor: 'pointer' }}
          onClick={() => onNavigate('invoices')}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Outstanding receivables
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>
            {formatUSD(snapshot.receivablesUsd)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
            {snapshot.openInvoices} open invoice{snapshot.openInvoices === 1 ? '' : 's'} →
          </div>
        </button>
      </div>
    </div>
  );
}

function SyncCard() {
  const status = useStatus();

  const connected = status?.connected ?? false;
  const syncing = status?.downloading || status?.uploading || status?.hasSynced === false;
  const error = status?.uploadError ?? status?.downloadError ?? null;
  const lastSynced = status?.lastSyncedAt;

  const dot = !connected ? '#f59e0b' : error ? '#dc2626' : syncing ? '#16a34a' : '#16a34a';
  const label = !connected
    ? 'Offline — changes queue locally'
    : error
      ? 'Sync error — working locally'
      : syncing
        ? 'Syncing…'
        : 'Synced';

  return (
    <div
      className="card"
      style={{ padding: 12, marginBottom: 12, fontSize: '0.85rem' }}
      role="status"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="sync-dot" style={{ background: dot }} />
        <strong>{label}</strong>
        {lastSynced ? (
          <span style={{ color: 'var(--text-muted)' }}>
            · Last synced {formatDate(lastSynced.toISOString())}
          </span>
        ) : null}
      </div>
      {error ? (
        <div style={{ color: 'var(--danger)', marginTop: 6 }}>
          {error.message}. Reconnect, then reopen the app to retry.
        </div>
      ) : null}
    </div>
  );
}

function ActionCard({
  count,
  label,
  sub,
  onClick
}: {
  count: number;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      className="card"
      style={{ padding: 16, textAlign: 'left', cursor: 'pointer' }}
      onClick={onClick}
    >
      <div
        style={{
          fontSize: '1.6rem',
          fontWeight: 800,
          color: count > 0 ? 'var(--primary)' : 'var(--success)'
        }}
      >
        {count}
      </div>
      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{label}</div>
      <div
        style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {sub}
      </div>
    </button>
  );
}
