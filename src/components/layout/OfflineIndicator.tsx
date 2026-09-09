import { useStatus } from '@powersync/react';
import { useEffect, useState } from 'react';

function useSyncState() {
  const status = useStatus();
  const [online, setOnline] = useState(navigator.onLine);

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

  const connected = status?.connected ?? false;
  const pending = status?.hasSynced === false;
  const ok = online && connected && !pending;

  const label = !online
    ? 'Offline — changes saved locally'
    : !connected
      ? 'Connecting…'
      : 'Syncing…';

  const color = !online ? '#f59e0b' : '#16a34a';
  return { ok, label, color };
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
