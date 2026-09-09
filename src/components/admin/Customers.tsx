import { useMemo, useState } from 'react';
import { receivedUsd, useAllReceipts, useInvoices } from '@/hooks/useInvoices';
import { useOrders } from '@/hooks/useOrders';
import { formatUSD } from '@/utils/format';
import { Input } from '@/components/ui/Field';
import { EmptyState, Spinner } from '@/components/ui/States';

interface CustomerRow {
  phone: string;
  name: string;
  orders: number;
  orderedUsd: number;
  invoicedUsd: number;
  paidUsd: number;
  balanceUsd: number;
  lastActivity: string;
}

export function Customers() {
  const { orders, isLoading: ordersLoading } = useOrders();
  const { invoices, isLoading: invoicesLoading } = useInvoices();
  const { receipts } = useAllReceipts();
  const [query, setQuery] = useState('');

  const rows = useMemo<CustomerRow[]>(() => {
    const byPhone = new Map<string, CustomerRow>();
    const touch = (phone: string | null, name: string | null, at: string | null) => {
      if (!phone) return null;
      let row = byPhone.get(phone);
      if (!row) {
        row = {
          phone,
          name: name ?? phone,
          orders: 0,
          orderedUsd: 0,
          invoicedUsd: 0,
          paidUsd: 0,
          balanceUsd: 0,
          lastActivity: ''
        };
        byPhone.set(phone, row);
      }
      if (name) row.name = name;
      if (at && at > row.lastActivity) row.lastActivity = at;
      return row;
    };

    for (const o of orders) {
      const row = touch(o.customer_phone, o.customer_name, o.created_at);
      if (!row) continue;
      row.orders += 1;
      row.orderedUsd += o.total_usd ?? 0;
    }

    const receiptsByInvoice = new Map<string, typeof receipts>();
    for (const r of receipts) {
      const key = r.invoice_id ?? '';
      if (!key) continue;
      const list = receiptsByInvoice.get(key) ?? [];
      list.push(r);
      receiptsByInvoice.set(key, list);
    }

    for (const inv of invoices) {
      const row = touch(inv.customer_phone, inv.customer_name, inv.created_at);
      if (!row) continue;
      const rate = inv.applied_rate_zig && inv.applied_rate_zig > 0 ? inv.applied_rate_zig : 1;
      const paid = receivedUsd(receiptsByInvoice.get(inv.id) ?? [], rate);
      row.invoicedUsd += inv.total_usd ?? 0;
      row.paidUsd += paid;
      if (['issued', 'partially_paid'].includes(inv.status ?? '')) {
        row.balanceUsd += Math.max(0, (inv.total_usd ?? 0) - paid);
      }
    }

    const round = (n: number) => Math.round(n * 100) / 100;
    for (const row of byPhone.values()) {
      row.orderedUsd = round(row.orderedUsd);
      row.invoicedUsd = round(row.invoicedUsd);
      row.paidUsd = round(row.paidUsd);
      row.balanceUsd = round(row.balanceUsd);
    }
    return [...byPhone.values()].sort((a, b) => b.balanceUsd - a.balanceUsd);
  }, [orders, invoices, receipts]);

  const q = query.trim().toLowerCase();
  const visible = q
    ? rows.filter(
        (r) => r.name.toLowerCase().includes(q) || r.phone.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
      )
    : rows;

  if (ordersLoading || invoicesLoading) return <Spinner />;

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Input
          type="search"
          placeholder="Search name or phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search customers"
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="No customers yet"
          message="Customers appear here once they order or are invoiced."
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Orders</th>
                <th>Invoiced</th>
                <th>Paid</th>
                <th>Owing</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.phone}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{r.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.phone}</div>
                  </td>
                  <td>{r.orders}</td>
                  <td>{formatUSD(r.invoicedUsd)}</td>
                  <td>{formatUSD(r.paidUsd)}</td>
                  <td style={{ fontWeight: r.balanceUsd > 0 ? 800 : 400 }}>
                    {formatUSD(r.balanceUsd)}
                  </td>
                  <td>
                    <a
                      className="btn btn-ghost"
                      style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                      href={`https://wa.me/${r.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Hello ${r.name}, this is Abundance Solutions.${r.balanceUsd > 0 ? ` Your outstanding balance is $${r.balanceUsd.toFixed(2)}.` : ''}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      WhatsApp
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
