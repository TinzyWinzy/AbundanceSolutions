import type { AssetStatus } from '@/utils/constants';
import { labelFor } from '@/utils/constants';

export function Badge({ value }: { value: string }) {
  const safe = value.replace(/[^a-z_]/gi, '');
  return <span className={`badge badge-${safe}`}>{labelFor(value)}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<AssetStatus, string> = {
    available: 'available',
    rented: 'rented',
    maintenance: 'maintenance',
    sold: 'sold'
  };
  const cls = map[status as AssetStatus] ?? 'pending';
  return <span className={`badge badge-${cls}`}>{labelFor(status)}</span>;
}
