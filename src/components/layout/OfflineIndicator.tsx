import { useStatus } from '@powersync/react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

function useSyncState() {
  const status = useStatus();
  const [online, setOnline] = useState(navigator.onLine);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setHasSession(!!data.session);
    });
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setHasSession(!!session);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const connected = status?.connected ?? false;
  const pending = status?.hasSynced === false;
  const failed = !!status?.downloadError;

  // Signed-out visitors never sync: nothing to report while online.
  if (!online) {
    return {
      ok: false,
      label: hasSession ? 'Offline: changes saved locally' : 'Offline: browsing cached catalog',
      color: '#f59e0b'
    };
  }
  if (!hasSession) {
    return { ok: true, label: '', color: '' };
  }
  if (failed) {
    return { ok: false, label: 'Sync unavailable: working locally', color: '#dc2626' };
  }
  if (!connected || pending) {
    return {
      ok: false,
      label: !connected ? 'Connecting…' : 'Syncing…',
      color: '#16a34a'
    };
  }
  return { ok: true, label: '', color: '' };
}

/** Compact pill for the desktop header row. */
export function OfflineIndicator() {
  const { ok, label, color } = useSyncState();
  if (ok) return null;

  return (
    <div className="sync-pill" role="status" style={{ color }}>
      <span className="sync-dot" style={{ background: color }} />
      {label}
    </div>
  );
}

/** Full-width strip under the header on mobile. */
export function OfflineStrip() {
  const { ok, label, color } = useSyncState();
  if (ok) return null;

  return (
    <div className="sync-strip" role="status" style={{ background: color }}>
      {label}
    </div>
  );
}
