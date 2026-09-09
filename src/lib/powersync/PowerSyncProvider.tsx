import { PowerSyncContext } from '@powersync/react';
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { BackendConnector } from './BackendConnector';
import { getDB } from './Database';

export function PowerSyncProvider({ children }: { children: React.ReactNode }) {
  const [db] = useState(() => getDB());
  const connector = useMemo(() => new BackendConnector(), []);

  useEffect(() => {
    let connected = false;

    const connect = async () => {
      if (connected) return;
      connected = true;
      try {
        await db.connect(connector);
      } catch (error) {
        connected = false;
        console.error('PowerSync connect failed:', error);
      }
    };

    const disconnect = async () => {
      connected = false;
      try {
        await db.disconnectAndClear();
      } catch (error) {
        console.error('PowerSync disconnect failed:', error);
      }
    };

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        connect();
      } else {
        disconnect();
      }
    });

    // Connect immediately if a session already exists.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) connect();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [db, connector]);

  return <PowerSyncContext.Provider value={db}>{children}</PowerSyncContext.Provider>;
}
