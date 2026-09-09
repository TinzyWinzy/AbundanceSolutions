import { supabase } from '@/lib/supabase/client';
import {
  UpdateType,
  type CommonPowerSyncDatabase,
  type PowerSyncBackendConnector
} from '@powersync/web';

const powersyncUrl = import.meta.env.VITE_POWERSYNC_URL;

/**
 * Bridges the local SQLite database to Supabase.
 *
 * - `fetchCredentials` returns a Supabase JWT so PowerSync can authenticate
 *   against the PowerSync service (which validates it via JWKS).
 * - `uploadData` applies queued local writes back to Supabase via the Data API.
 *   These calls run under the user's session, so RLS still applies server-side.
 */
export class BackendConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    const {
      data: { session },
      error
    } = await supabase.auth.getSession();

    if (error || !session) {
      return null;
    }

    return {
      endpoint: powersyncUrl,
      token: session.access_token,
      expiresAt: session.expires_at
        ? new Date(session.expires_at * 1000)
        : undefined
    };
  }

  async uploadData(database: CommonPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) {
      return;
    }

    try {
      for (const op of transaction.crud) {
        const table = op.table;
        const opData = op.opData ?? {};

        switch (op.op) {
          case UpdateType.PUT:
            await supabase.from(table).upsert({ id: op.id, ...opData });
            break;
          case UpdateType.PATCH:
            await supabase.from(table).update(opData).eq('id', op.id);
            break;
          case UpdateType.DELETE:
            await supabase.from(table).delete().eq('id', op.id);
            break;
        }
      }

      await transaction.complete();
    } catch (error) {
      console.error('Data upload failed (will retry):', error);
      throw error;
    }
  }
}
