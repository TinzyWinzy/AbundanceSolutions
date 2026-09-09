import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useCart } from '@/stores/cart';
import { submitOrder, type CheckoutResult } from '@/lib/checkout/submitOrder';
import { openWhatsAppCheckout } from '@/lib/whatsapp/bridge';
import { formatUSD } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/States';

type Step = 'review' | 'details' | 'done';

interface SnapshotLine {
  name: string;
  quantity: number;
  unitPriceUsd: number | null;
  unitPriceZig: number | null;
}

function normalizePhone(raw: string): string {
  let p = raw.replace(/[\s\-()]/g, '');
  if (p.startsWith('+')) p = p.slice(1);
  if (p.startsWith('0')) p = '263' + p.slice(1);
  return p;
}

export function CheckoutPage() {
  const { items, remove, setQuantity, clear } = useCart();
  const [step, setStep] = useState<Step>('review');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [snapshot, setSnapshot] = useState<SnapshotLine[]>([]);

  const totalUsd = items.reduce((s, i) => s + (i.unitPriceUsd ?? 0) * i.quantity, 0);
  const totalZig = items.reduce((s, i) => s + (i.unitPriceZig ?? 0) * i.quantity, 0);

  if (items.length === 0 && step !== 'done') {
    return <Navigate to="/store" replace />;
  }

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    const normalized = normalizePhone(phone);
    if (!/^263\d{9}$/.test(normalized)) {
      setError('Enter a valid ZW number, e.g. 263719450765 or 0719450765.');
      return;
    }
    if (!navigator.onLine) {
      setError('You are offline. Reconnect to place your order — your cart is saved.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitOrder({
        customerName: name.trim(),
        customerPhone: normalized,
        lines: items.map((i) => ({ assetId: i.assetId, quantity: i.quantity }))
      });
      setSnapshot(
        items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unitPriceUsd: i.unitPriceUsd,
          unitPriceZig: i.unitPriceZig
        }))
      );
      setResult(res);
      clear();
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const sendWhatsApp = () => {
    if (!result) return;
    openWhatsAppCheckout({
      reference: result.reference,
      customerName: name.trim(),
      lines: snapshot,
      totalUsd: result.totalUsd,
      totalZig: result.totalZig ?? 0
    });
  };

  if (step === 'done' && result) {
    return (
      <div className="card" style={{ maxWidth: 520, margin: '32px auto', padding: 28, textAlign: 'center' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--success-soft)',
            color: 'var(--success)',
            fontSize: '1.8rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px'
          }}
        >
          ✓
        </div>
        <h1 style={{ margin: '0 0 4px', fontSize: '1.4rem' }}>Order received</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>
          Reference <strong style={{ color: 'var(--text)' }}>{result.reference}</strong>
        </p>
        <p>
          {formatUSD(result.totalUsd)}
          {result.totalZig != null ? ` · ZiG ${result.totalZig.toLocaleString()}` : ''}
        </p>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Your order is saved. One tap sends it to us on WhatsApp — we confirm availability and
          delivery from there.
        </p>
        <Button block onClick={sendWhatsApp}>
          Send order on WhatsApp
        </Button>
        <p style={{ marginTop: 12 }}>
          <Link to="/store">Back to store</Link>
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <CheckoutSteps step={step} />

      {step === 'review' ? (
        <>
          <h1 style={{ fontSize: '1.4rem' }}>Review your enquiry</h1>
          {items.map((item) => (
            <div
              key={item.assetId}
              className="card"
              style={{
                padding: 12,
                marginBottom: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{item.name}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {formatUSD(item.unitPriceUsd)} × {item.quantity}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => setQuantity(item.assetId, item.quantity - 1)}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span style={{ minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                <button
                  className="btn btn-ghost"
                  onClick={() => setQuantity(item.assetId, item.quantity + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ color: 'var(--danger)' }}
                  onClick={() => remove(item.assetId)}
                  aria-label="Remove item"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 800,
              fontSize: '1.05rem',
              margin: '16px 0'
            }}
          >
            <span>Total</span>
            <span>
              {formatUSD(totalUsd)}
              {totalZig > 0 ? ` · ZiG ${totalZig.toLocaleString()}` : ''}
            </span>
          </div>
          <Button block onClick={() => setStep('details')}>
            Continue →
          </Button>
        </>
      ) : (
        <>
          <h1 style={{ fontSize: '1.4rem' }}>Your details</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 0 }}>
            Only what we need to confirm your order on WhatsApp.
          </p>
          <form onSubmit={placeOrder}>
            <Field label="Full name *" htmlFor="co-name">
              <Input
                id="co-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </Field>
            <Field label="Phone / WhatsApp *" htmlFor="co-phone">
              <Input
                id="co-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0719 450 765"
                autoComplete="tel"
                required
              />
            </Field>

            <div className="card" style={{ padding: 12, marginBottom: 14, fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  {items.reduce((n, i) => n + i.quantity, 0)} item(s)
                </span>
                <strong>{formatUSD(totalUsd)}</strong>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Final prices confirmed from our system when you place the order.
              </div>
            </div>

            {error ? (
              <p style={{ color: 'var(--danger)', fontSize: '0.88rem' }}>{error}</p>
            ) : null}

            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" onClick={() => setStep('review')} disabled={submitting}>
                Back
              </Button>
              <Button type="submit" block disabled={submitting} style={{ flex: 1 }}>
                {submitting ? <Spinner /> : 'Place order'}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

function CheckoutSteps({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: 'review', label: 'Review' },
    { key: 'details', label: 'Details' },
    { key: 'done', label: 'Done' }
  ];
  const activeIdx = steps.findIndex((s) => s.key === step);
  return (
    <ol
      style={{
        listStyle: 'none',
        display: 'flex',
        gap: 6,
        padding: 0,
        margin: '0 0 20px'
      }}
      aria-label="Checkout progress"
    >
      {steps.map((s, i) => (
        <li
          key={s.key}
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: '0.78rem',
            fontWeight: 700,
            padding: '8px 4px',
            borderRadius: 8,
            background: i < activeIdx ? 'var(--success-soft)' : i === activeIdx ? 'var(--primary-soft)' : 'var(--surface-2)',
            color: i <= activeIdx ? 'var(--text)' : 'var(--text-muted)'
          }}
          aria-current={i === activeIdx ? 'step' : undefined}
        >
          {i + 1}. {s.label}
        </li>
      ))}
    </ol>
  );
}
