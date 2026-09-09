import { PowerSyncDatabase } from '@powersync/web';
import { AppSchema } from './AppSchema';

// Module-level singleton — PowerSync requires exactly one instance per db file.
let dbInstance: PowerSyncDatabase | null = null;

export function getDB(): PowerSyncDatabase {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = new PowerSyncDatabase({
    schema: AppSchema,
    database: {
      dbFilename: 'abundance.db'
    }
  });

  return dbInstance;
}
