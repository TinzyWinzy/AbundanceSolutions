import { useQuery } from '@powersync/react';
import type { Database } from '@/lib/powersync/AppSchema';

/**
 * Reactive financial-log query against the local PowerSync SQLite database.
 */
export function useFinancialLogs(limit = 100) {
  const { data: logs, isLoading, error } = useQuery<Database['financial_logs']>(
    'SELECT * FROM financial_logs ORDER BY logged_at DESC LIMIT ?',
    [limit]
  );

  return { logs: logs ?? [], isLoading, error };
}

export function useFinancialSummary() {
  const { data } = useQuery<{ currency: string; total: number }>(
    `SELECT currency, SUM(amount) AS total
     FROM financial_logs
     WHERE transaction_type IN ('sale', 'rental')
     GROUP BY currency`
  );

  return { summary: data ?? [] };
}
