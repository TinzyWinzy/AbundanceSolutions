import { usePowerSync } from '@powersync/react';
import { useMemo, useState } from 'react';
import type { InventoryAsset } from '@/lib/powersync/AppSchema';
import { updateAssetStatus } from '@/lib/powersync/mutations';
import { exportCsv } from '@/utils/csv';
import { formatUSD } from '@/utils/format';
import { Input } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/States';
import { ASSET_STATUSES } from '@/utils/constants';

export function InventoryTable({
  assets,
  onEdit
}: {
  assets: InventoryAsset[];
  onEdit: (asset: InventoryAsset) => void;
}) {
  const db = usePowerSync();
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter(
      (a) =>
        (a.name ?? '').toLowerCase().includes(q) ||
        (a.sku ?? '').toLowerCase().includes(q)
    );
  }, [assets, query]);

  if (assets.length === 0) {
    return <EmptyState title="No equipment yet" message="Add your first asset to start tracking." />;
  }

  return (
    <>
    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
      <Input
        type="search"
        placeholder="Search name or SKU…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search equipment"
        style={{ flex: 1 }}
      />
      <button
        className="btn btn-secondary"
        style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}
        onClick={() =>
          exportCsv(
            'inventory.csv',
            ['Name', 'SKU', 'Status', 'Stock', 'USD', 'ZiG'],
            visible.map((a) => [
              a.name,
              a.sku,
              a.status,
              a.stock_count,
              a.price_usd,
              a.price_zig
            ])
          )
        }
      >
        Export CSV
      </button>
    </div>
    {visible.length === 0 ? (
      <EmptyState title="No matches" message={`Nothing matches “${query}”.`} />
    ) : (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Stock</th>
            <th>USD</th>
            <th>ZiG</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {visible.map((asset) => (
            <tr key={asset.id}>
              <td style={{ fontWeight: 600 }}>{asset.name}</td>
              <td>
                <select
                  className="select"
                  style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                  value={asset.status ?? 'available'}
                  onChange={(e) => updateAssetStatus(db, asset.id, e.target.value)}
                >
                  {ASSET_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                {asset.stock_count}
                {(asset.min_stock ?? 0) > 0 && (asset.stock_count ?? 0) <= (asset.min_stock ?? 0) ? (
                  <span style={{ color: 'var(--danger)', marginLeft: 6 }} title="Low stock">
                    ⚠
                  </span>
                ) : null}
              </td>
              <td>{asset.price_usd != null ? formatUSD(asset.price_usd) : '-'}</td>
              <td>{asset.price_zig != null ? `ZiG ${asset.price_zig.toLocaleString()}` : '-'}</td>
              <td>
                <button
                  className="btn btn-ghost"
                  style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                  onClick={() => onEdit(asset)}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    )}
    </>
  );
}
