import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'abundance-install-dismissed';

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === '1'
  );

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferred || dismissed) return null;

  const install = async () => {
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  };

  return (
    <div
      className="card"
      style={{
        position: 'fixed',
        bottom: 76,
        left: 16,
        right: 16,
        maxWidth: 480,
        margin: '0 auto',
        zIndex: 55,
        padding: 14,
        display: 'flex',
        gap: 12,
        alignItems: 'center'
      }}
      role="dialog"
      aria-label="Install app"
    >
      <div style={{ flex: 1, fontSize: '0.88rem' }}>
        <strong>Install Abundance</strong>
        <div style={{ color: 'var(--text-muted)' }}>
          Faster access, works offline on site.
        </div>
      </div>
      <button className="btn btn-primary" onClick={install}>
        Install
      </button>
      <button className="btn btn-ghost" onClick={dismiss} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}
