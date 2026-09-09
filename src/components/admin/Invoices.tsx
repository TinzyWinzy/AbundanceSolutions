import { usePowerSync } from '@powersync/react';
import { useMemo, useState } from 'react';
import type { InventoryAsset, ProFormaInvoice } from '@/lib/powersync/AppSchema';
import {
  cancelInvoice,
  createInvoice,
  recordReceipt,
  saveExchangeRate,
  type InvoiceLineInput
} from '@/lib/powersync/mutations';
import { useAuth } from '@/hooks/useAuth';
import {
  receivedUsd,
  useInvoiceLines,
  useInvoiceReceipts,
  useInvoices,
  useLatestRate
} from '@/hooks/useInvoices';
import {
  computeTotals,
  nextInvoiceNumber,
  nextReceiptNumber,
  openInvoiceWhatsApp
} from '@/utils/invoices';
import { formatDate, formatMoney, formatUSD } from '@/utils/format';
import { CURRENCIES, labelFor, PAYMENT_METHODS } from '@/utils/constants';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, Spinner } from '@/components/ui/States';

export function Invoices({ assets }: { assets: InventoryAsset[] }) {
  const { invoices, isLoading } = useInvoices();
  const { rate } = useLatestRate();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const openCount = invoices.filter((i) =>
    ['draft', 'issued', 'partially_paid'].includes(i.status ?? '')
  ).length;

  return (
    <div>
      <div
        className="card"
        style={{
          padding: 12,
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap'
        }}
      >
        <div style={{ fontSize: '0.85rem' }}>
          <strong>USD/ZiG rate: </strong>
          {rate ? (
            <span>
              {rate.official_rate?.toFixed(4)} (since {formatDate(rate.effective_at)})
            </span>
          ) : (
            <span style={{ color: 'var(--danger)' }}>
              Not set — set the day&apos;s official rate before issuing invoices.
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={() => setRateOpen(true)}>
            Set rate
          </Button>
          <Button onClick={() => setBuilderOpen(true)}>New invoice</Button>
        </div>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 12px' }}>
        {openCount} open invoice{openCount === 1 ? '' : 's'} · {invoices.length} total
      </p>

      {isLoading ? (
        <Spinner />
      ) : invoices.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          message="Issue your first pro-forma invoice to a customer."
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Number</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => setSelectedId(inv.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ fontWeight: 600 }}>{inv.invoice_number}</td>
                  <td>{inv.customer_name}</td>
                  <td>{formatUSD(inv.total_usd)}</td>
                  <td>
                    <Badge value={inv.status ?? 'draft'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={builderOpen} title="New pro-forma invoice" onClose={() => setBuilderOpen(false)}>
        <InvoiceBuilder
          assets={assets}
          defaultRate={rate?.official_rate ?? null}
          onDone={() => setBuilderOpen(false)}
        />
      </Modal>

      <Modal open={rateOpen} title="Set exchange rate" onClose={() => setRateOpen(false)}>
        <RateForm onDone={() => setRateOpen(false)} />
      </Modal>

      {selectedId ? (
        <InvoiceDetailModal invoiceId={selectedId} onClose={() => setSelectedId(null)} />
      ) : null}
    </div>
  );
}

function RateForm({ onDone }: { onDone: () => void }) {
  const db = usePowerSync();
  const { profile, user } = useAuth();
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rate = Number(value);
    if (!profile || !user) {
      setError('You must be signed in.');
      return;
    }
    if (!value || Number.isNaN(rate) || rate <= 0) {
      setError('Enter a valid rate greater than zero.');
      return;
    }
    setSaving(true);
    try {
      await saveExchangeRate(db, profile.organization_id, user.id, rate);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <Field label="Official USD/ZiG rate *">
        <Input
          type="number"
          step="0.0001"
          min="0.0001"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. 26.5000"
          required
        />
      </Field>
      {error ? <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p> : null}
      <Button type="submit" block disabled={saving}>
        {saving ? 'Saving…' : 'Save rate'}
      </Button>
    </form>
  );
}

interface BuilderLine extends InvoiceLineInput {
  key: string;
}

function InvoiceBuilder({
  assets,
  defaultRate,
  onDone
}: {
  assets: InventoryAsset[];
  defaultRate: number | null;
  onDone: () => void;
}) {
  const db = usePowerSync();
  const { profile, user } = useAuth();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerTaxId, setCustomerTaxId] = useState('');
  const [rate, setRate] = useState(defaultRate != null ? String(defaultRate) : '');
  const [vatPct, setVatPct] = useState('15');
  const [validDays, setValidDays] = useState('30');
  const [lines, setLines] = useState<BuilderLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rateNum = Number(rate);
  const totals = useMemo(
    () => computeTotals(lines, Number.isNaN(rateNum) ? 0 : rateNum, Number(vatPct) / 100 || 0),
    [lines, rateNum, vatPct]
  );

  const addLine = (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    if (!asset) return;
    setLines((ls) => [
      ...ls,
      {
        key: crypto.randomUUID(),
        assetId: asset.id,
        description: asset.name ?? 'Unnamed item',
        quantity: 1,
        unitPriceUsd: asset.price_usd ?? 0
      }
    ]);
  };

  const addCustomLine = () => {
    setLines((ls) => [
      ...ls,
      { key: crypto.randomUUID(), assetId: null, description: '', quantity: 1, unitPriceUsd: 0 }
    ]);
  };

  const updateLine = (key: string, patch: Partial<BuilderLine>) => {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };

  const removeLine = (key: string) => {
    setLines((ls) => ls.filter((l) => l.key !== key));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) {
      setError('You must be signed in.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Customer name and phone are required.');
      return;
    }
    if (lines.length === 0) {
      setError('Add at least one line item.');
      return;
    }
    if (!rate || Number.isNaN(rateNum) || rateNum <= 0) {
      setError('A valid exchange rate is required.');
      return;
    }
    if (lines.some((l) => !l.description.trim() || l.quantity <= 0 || l.unitPriceUsd < 0)) {
      setError('Each line needs a description, quantity of at least 1, and a valid price.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const validUntil = new Date(
        Date.now() + (Number(validDays) || 30) * 24 * 60 * 60 * 1000
      ).toISOString();
      await createInvoice(db, {
        organizationId: profile.organization_id,
        userId: user.id,
        invoiceNumber: nextInvoiceNumber(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerTaxId: customerTaxId.trim() || undefined,
        lines: lines.map((l) => ({
          assetId: l.assetId,
          description: l.description.trim(),
          quantity: l.quantity,
          unitPriceUsd: l.unitPriceUsd
        })),
        vatUsd: totals.vatUsd,
        appliedRateZig: rateNum,
        validUntil
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Customer name *">
          <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
        </Field>
        <Field label="Customer phone *">
          <Input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="263..."
            required
          />
        </Field>
      </div>

      <Field label="Customer TAX ID (optional)">
        <Input value={customerTaxId} onChange={(e) => setCustomerTaxId(e.target.value)} />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="Rate (ZiG) *">
          <Input
            type="number"
            step="0.0001"
            min="0.0001"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            required
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

      <div style={{ marginBottom: 8, fontWeight: 700, fontSize: '0.85rem' }}>Line items</div>
      {lines.map((line) => (
        <div
          key={line.key}
          className="card"
          style={{ padding: 10, marginBottom: 8, background: 'var(--surface-2)' }}
        >
          <Input
            value={line.description}
            onChange={(e) => updateLine(line.key, { description: e.target.value })}
            placeholder="Description"
            style={{ marginBottom: 8 }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8 }}>
            <Input
              type="number"
              min="1"
              value={line.quantity}
              onChange={(e) => updateLine(line.key, { quantity: Number(e.target.value) })}
              aria-label="Quantity"
            />
            <Input
              type="number"
              step="0.01"
              min="0"
              value={line.unitPriceUsd}
              onChange={(e) => updateLine(line.key, { unitPriceUsd: Number(e.target.value) })}
              aria-label="Unit price USD"
            />
            <button
              type="button"
              className="btn btn-ghost"
              style={{ color: 'var(--danger)' }}
              onClick={() => removeLine(line.key)}
              aria-label="Remove line"
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <Select
          value=""
          onChange={(e) => {
            if (e.target.value) addLine(e.target.value);
          }}
          style={{ flex: 1, minWidth: 160 }}
        >
          <option value="">Add equipment…</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
        <Button type="button" variant="secondary" onClick={addCustomLine}>
          Custom line
        </Button>
      </div>

      <div style={{ fontSize: '0.9rem', marginBottom: 12 }}>
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
            {formatUSD(totals.totalUsd)} · ZiG {totals.totalZig.toLocaleString()}
          </span>
        </div>
      </div>

      {error ? <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p> : null}

      <Button type="submit" block disabled={saving}>
        {saving ? 'Issuing…' : 'Issue invoice'}
      </Button>
    </form>
  );
}

function InvoiceDetailModal({ invoiceId, onClose }: { invoiceId: string; onClose: () => void }) {
  const db = usePowerSync();
  const { profile, user } = useAuth();
  const { invoices } = useInvoices();
  const { lines } = useInvoiceLines(invoiceId);
  const { receipts } = useInvoiceReceipts(invoiceId);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const invoice: ProFormaInvoice | undefined = invoices.find((i) => i.id === invoiceId);
  if (!invoice) return null;

  const rate = invoice.applied_rate_zig ?? 1;
  const received = receivedUsd(receipts, rate);
  const balance = Math.max(0, (invoice.total_usd ?? 0) - received);
  const cancellable = ['draft', 'issued'].includes(invoice.status ?? '');

  const handleShare = () => {
    openInvoiceWhatsApp({
      invoiceNumber: invoice.invoice_number ?? '',
      customerName: invoice.customer_name ?? '',
      lines: lines.map((l) => ({
        description: l.description ?? '',
        quantity: l.quantity ?? 0,
        unitPriceUsd: l.unit_price_usd ?? 0
      })),
      totalUsd: invoice.total_usd ?? 0,
      totalZig: invoice.total_zig ?? 0,
      validUntil: invoice.valid_until ? formatDate(invoice.valid_until) : null
    });
  };

  const handleCancel = async () => {
    if (!window.confirm(`Cancel invoice ${invoice.invoice_number}?`)) return;
    await cancelInvoice(db, invoice.id);
    onClose();
  };

  return (
    <Modal open title={invoice.invoice_number ?? 'Invoice'} onClose={onClose}>
      <div className="print-doc">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>Abundance Solutions</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Pro-Forma Invoice
            </div>
          </div>
          <Badge value={invoice.status ?? 'draft'} />
        </div>

        <div style={{ fontSize: '0.85rem', marginBottom: 12 }}>
          <div>
            <strong>Customer:</strong> {invoice.customer_name} · {invoice.customer_phone}
          </div>
          {invoice.customer_tax_id ? (
            <div>
              <strong>TAX ID:</strong> {invoice.customer_tax_id}
            </div>
          ) : null}
          <div>
            <strong>Issued:</strong> {formatDate(invoice.created_at)} · <strong>Valid until:</strong>{' '}
            {formatDate(invoice.valid_until)}
          </div>
          <div>
            <strong>Rate:</strong> USD/ZiG {rate}
          </div>
        </div>

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
              {lines.map((l) => (
                <tr key={l.id}>
                  <td style={{ whiteSpace: 'normal' }}>{l.description}</td>
                  <td>{l.quantity}</td>
                  <td>{formatUSD(l.unit_price_usd)}</td>
                  <td>{formatUSD(l.total_price_usd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ fontSize: '0.9rem', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal</span>
            <span>{formatUSD(invoice.subtotal_usd)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>VAT</span>
            <span>{formatUSD(invoice.vat_usd)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
            <span>Total</span>
            <span>
              {formatUSD(invoice.total_usd)} · ZiG {(invoice.total_zig ?? 0).toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Received</span>
            <span>{formatUSD(received)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
            <span>Balance due</span>
            <span>{formatUSD(balance)}</span>
          </div>
        </div>

        {receipts.length > 0 ? (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 4 }}>Receipts</div>
            {receipts.map((r) => (
              <div key={r.id} style={{ fontSize: '0.82rem' }}>
                {r.receipt_number} · {formatMoney(r.amount_paid, r.currency ?? 'USD')} ·{' '}
                {labelFor(r.payment_method ?? '')}
                {r.reference_number ? ` · Ref ${r.reference_number}` : ''} ·{' '}
                {formatDate(r.created_at)}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="no-print" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        {profile && user && balance > 0 && invoice.status !== 'cancelled' ? (
          <Button onClick={() => setPaymentOpen(true)}>Record payment</Button>
        ) : null}
        <Button variant="secondary" onClick={handleShare}>
          WhatsApp
        </Button>
        <Button variant="secondary" onClick={() => window.print()}>
          Print
        </Button>
        {cancellable ? (
          <Button variant="danger" onClick={handleCancel}>
            Cancel
          </Button>
        ) : null}
      </div>

      <Modal open={paymentOpen} title="Record payment" onClose={() => setPaymentOpen(false)}>
        <PaymentForm
          invoiceId={invoice.id}
          onDone={() => setPaymentOpen(false)}
        />
      </Modal>
    </Modal>
  );
}

function PaymentForm({ invoiceId, onDone }: { invoiceId: string; onDone: () => void }) {
  const db = usePowerSync();
  const { profile, user } = useAuth();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [method, setMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!profile || !user) {
      setError('You must be signed in.');
      return;
    }
    if (!amount || Number.isNaN(value) || value <= 0) {
      setError('Enter a valid amount greater than zero.');
      return;
    }
    setSaving(true);
    try {
      await recordReceipt(db, {
        organizationId: profile.organization_id,
        userId: user.id,
        invoiceId,
        receiptNumber: nextReceiptNumber(),
        amount: value,
        currency,
        paymentMethod: method,
        referenceNumber: reference.trim() || undefined
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Amount *">
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </Field>
        <Field label="Currency">
          <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.filter((c) => c !== 'EcoCash').map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Payment method">
        <Select value={method} onChange={(e) => setMethod(e.target.value)}>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Reference (EcoCash ID / bank ref)">
        <Input value={reference} onChange={(e) => setReference(e.target.value)} />
      </Field>
      {error ? <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p> : null}
      <Button type="submit" block disabled={saving}>
        {saving ? 'Saving…' : 'Issue receipt'}
      </Button>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
        Invoice status updates to partially paid / paid automatically on sync via server trigger.
      </p>
    </form>
  );
}
