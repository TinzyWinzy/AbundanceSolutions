import { usePowerSync } from '@powersync/react';
import type { InventoryAsset } from '@/lib/powersync/AppSchema';
import { updateAssetStatus } from '@/lib/powersync/mutations';
import { formatUSD } from '@/utils/format';
import { EmptyState } from '@/components/ui/States';
import { ASSET_STATUSES } from '@/utils/constants';

export function InventoryTable({ assets }: { assets: InventoryAsset[] }) {
  const db = usePowerSync();

  if (assets.length === 0) {
    return <EmptyState title="No equipment yet" message="Add your first asset to start tracking." />;
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Stock</th>
            <th>USD</th>
            <th>ZiG</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
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
              <td>{asset.price_usd != null ? formatUSD(asset.price_usd) : '—'}</td>
              <td>{asset.price_zig != null ? `ZiG ${asset.price_zig.toLocaleString()}` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
