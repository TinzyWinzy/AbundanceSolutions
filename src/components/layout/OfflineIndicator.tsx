import { useStatus } from '@powersync/react';
import { useEffect, useState } from 'react';

export function OfflineIndicator() {
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
  const hasPending = status?.hasSynced === false;

  if (online && connected && !hasPending) {
    return null;
  }

  const label = !online
    ? 'Offline — changes saved locally'
    : !connected
      ? 'Connecting…'
      : 'Syncing pending changes…';

  const color = !online ? '#f59e0b' : '#16a34a';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: '0.72rem',
        fontWeight: 600,
        color,
        background: 'var(--surface-2)',
        padding: '4px 10px',
        borderRadius: 999
      }}
      role="status"
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          display: 'inline-block'
        }}
      />
      {label}
    </div>
  );
}
