import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useCart } from '@/stores/cart';
import {
  computeQuoteTotals,
  nextQuoteNumber,
  openQuoteWhatsApp
} from '@/utils/quotations';
import { formatDate, formatUSD } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';

export function QuotePage() {
  const { items } = useCart();
  const [quoteNumber] = useState(() => nextQuoteNumber());
  const [customerName, setCustomerName] = useState('');
  const [rate, setRate] = useState('');
  const [vatPct, setVatPct] = useState('15');
  const [validDays, setValidDays] = useState('14');

  const lines = useMemo(
    () =>
      items.map((i) => ({
        description: i.name,
        quantity: i.quantity,
        unitPriceUsd: i.unitPriceUsd
      })),
    [items]
  );

  const rateNum = rate.trim() === '' ? null : Number(rate);
  const rateValid = rateNum === null || (!Number.isNaN(rateNum) && rateNum > 0);
  const totals = useMemo(
    () => computeQuoteTotals(lines, rateValid ? rateNum : null, Number(vatPct) / 100 || 0),
    [lines, rateNum, rateValid, vatPct]
  );

  const hasUnpriced = lines.some((l) => l.unitPriceUsd == null);
  const validUntil = new Date(
    Date.now() + (Number(validDays) || 14) * 24 * 60 * 60 * 1000
  );

  if (items.length === 0) {
    return <Navigate to="/store" replace />;
  }

  const share = () => {
    openQuoteWhatsApp({
      quoteNumber,
      customerName: customerName.trim() || null,
      lines,
      totals,
      validUntil: validUntil.toLocaleDateString('en-ZW', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      hasUnpricedLines: hasUnpriced
    });
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Build a quotation</h1>
      <p style={{ color: 'var(--text-muted)', marginTop: 0, fontSize: '0.9rem' }}>
        Instant itemized quote from your enquiry. Non-binding — our staff issue the formal
        pro-forma invoice.
      </p>

      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Your name (optional)">
          <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </Field>
        <Field label="ZiG rate (optional)">
          <Input
            type="number"
            step="0.0001"
            min="0.0001"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="e.g. 26.5"
          />
        </Field>
        <Field label="VAT %">
          <Input
            type="number"
            step="0.1"
            min="0"
            value={vatPct}
            onChange={(e) => setVatPct(e.target.value)}
          />
        </Field>
        <Field label="Valid (days)">
          <Input
            type="number"
            min="1"
            value={validDays}
            onChange={(e) => setValidDays(e.target.value)}
          />
        </Field>
      </div>
      {!rateValid && (
        <p className="no-print" style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>
          Enter a valid rate, or leave it empty for a USD-only quote.
        </p>
      )}

      <div className="card print-doc" style={{ padding: 20, marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>Abundance Solutions</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Quotation</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
            <div style={{ fontWeight: 800 }}>{quoteNumber}</div>
            <div style={{ color: 'var(--text-muted)' }}>{formatDate(new Date().toISOString())}</div>
          </div>
        </div>

        {customerName.trim() && (
          <div style={{ fontSize: '0.85rem', marginBottom: 12 }}>
            <strong>Prepared for:</strong> {customerName.trim()}
          </div>
        )}

        <div className="table-wrap" style={{ marginBottom: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit USD</th>
                <th>Total USD</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i}>
                  <td style={{ whiteSpace: 'normal' }}>{l.description}</td>
                  <td>{l.quantity}</td>
                  <td>{l.unitPriceUsd != null ? formatUSD(l.unitPriceUsd) : 'TBC'}</td>
                  <td>
                    {l.unitPriceUsd != null
                      ? formatUSD(l.unitPriceUsd * l.quantity)
                      : 'TBC'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal</span>
            <span>{formatUSD(totals.subtotalUsd)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>VAT ({vatPct || 0}%)</span>
            <span>{formatUSD(totals.vatUsd)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
            <span>Total</span>
            <span>
              {formatUSD(totals.totalUsd)}
              {totals.totalZig > 0 ? ` · ZiG ${totals.totalZig.toLocaleString()}` : ''}
            </span>
          </div>
          <div
            style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}
          >
            Valid until{' '}
            {validUntil.toLocaleDateString('en-ZW', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
            . Indicative quote — final pricing confirmed on order.
          </div>
        </div>
      </div>

      <div className="no-print" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
        <Button onClick={share}>Send quote on WhatsApp</Button>
        <Button variant="secondary" onClick={() => window.print()}>
          Print / PDF
        </Button>
        <Link to="/checkout" className="btn btn-secondary">
          Convert to order →
        </Link>
      </div>
    </div>
  );
}
