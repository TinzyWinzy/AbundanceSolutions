import { useEffect, useState } from 'react';

interface Toast {
  id: number;
  message: string;
}

let nextId = 1;
const listeners = new Set<(toasts: Toast[]) => void>();
let toasts: Toast[] = [];

function emit() {
  for (const fn of listeners) fn([...toasts]);
}

/** Fire-and-forget confirmation. Auto-dismisses after 2.5s. */
export function toast(message: string): void {
  const id = nextId++;
  toasts = [...toasts, { id, message }];
  emit();
  window.setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 2500);
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.add(setItems);
    return () => {
      listeners.delete(setItems);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'center'
      }}
    >
      {items.map((t) => (
        <div
          key={t.id}
          style={{
            background: 'var(--text)',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: 999,
            fontSize: '0.85rem',
            boxShadow: 'var(--shadow-md)',
            maxWidth: '90vw',
            textAlign: 'center'
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
