import type { FinancialLog } from '@/lib/powersync/AppSchema';
import { formatDate, formatMoney } from '@/utils/format';
import { labelFor } from '@/utils/constants';
import { EmptyState } from '@/components/ui/States';

export function FinancialLogTable({ logs }: { logs: FinancialLog[] }) {
  if (logs.length === 0) {
    return <EmptyState title="No transactions yet" message="Log your first sale or expense." />;
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Currency</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Ref</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{formatDate(log.logged_at)}</td>
              <td>{labelFor(log.transaction_type ?? '')}</td>
              <td>{log.currency}</td>
              <td style={{ fontWeight: 600 }}>{formatMoney(log.amount, log.currency ?? 'USD')}</td>
              <td>{labelFor(log.payment_method ?? '')}</td>
              <td>{log.reference_number ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
