import { usePowerSync } from '@powersync/react';
import { useState } from 'react';
import type { InventoryAsset, Site } from '@/lib/powersync/AppSchema';
import { createFinancialLog } from '@/lib/powersync/mutations';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { CURRENCIES, PAYMENT_METHODS, TRANSACTION_TYPES } from '@/utils/constants';

interface FinancialLogFormProps {
  assets: InventoryAsset[];
  sites: Site[];
  onDone: () => void;
}

export function FinancialLogForm({ assets, sites, onDone }: FinancialLogFormProps) {
  const db = usePowerSync();
  const { profile, user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    transactionType: 'sale',
    currency: 'USD',
    amount: '',
    paymentMethod: 'cash',
    description: '',
    referenceNumber: '',
    assetId: '',
    siteId: ''
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) {
      setError('You must be signed in to log a transaction.');
      return;
    }
    const amount = Number(form.amount);
    if (!form.amount || Number.isNaN(amount) || amount <= 0) {
      setError('Enter a valid amount greater than zero.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createFinancialLog(db, {
        organizationId: profile.organization_id,
        userId: user.id,
        siteId: form.siteId || null,
        assetId: form.assetId || null,
        transactionType: form.transactionType,
        currency: form.currency,
        amount,
        description: form.description.trim() || undefined,
        referenceNumber: form.referenceNumber.trim() || undefined,
        paymentMethod: form.paymentMethod
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Type">
          <Select
            value={form.transactionType}
            onChange={(e) => set('transactionType')(e.target.value)}
          >
            {TRANSACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Currency">
          <Select value={form.currency} onChange={(e) => set('currency')(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Amount *">
        <Input
          type="number"
          step="0.01"
          min="0.01"
          value={form.amount}
          onChange={(e) => set('amount')(e.target.value)}
          required
        />
      </Field>

      <Field label="Payment method">
        <Select value={form.paymentMethod} onChange={(e) => set('paymentMethod')(e.target.value)}>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Equipment">
        <Select value={form.assetId} onChange={(e) => set('assetId')(e.target.value)}>
          <option value="">— None —</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Site">
        <Select value={form.siteId} onChange={(e) => set('siteId')(e.target.value)}>
          <option value="">— Unassigned —</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Reference number">
        <Input
          value={form.referenceNumber}
          onChange={(e) => set('referenceNumber')(e.target.value)}
        />
      </Field>

      <Field label="Description">
        <Textarea
          value={form.description}
          onChange={(e) => set('description')(e.target.value)}
          rows={2}
        />
      </Field>

      {error ? <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p> : null}

      <Button type="submit" block disabled={saving}>
        {saving ? 'Saving…' : 'Log transaction'}
      </Button>
    </form>
  );
}
