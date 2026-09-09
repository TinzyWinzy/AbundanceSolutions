import { usePowerSync } from '@powersync/react';
import { useQuery } from '@powersync/react';
import { useEffect, useState } from 'react';
import type { Database } from '@/lib/powersync/AppSchema';
import { updateOrganization } from '@/lib/powersync/mutations';
import { useOrganization } from '@/hooks/useOrg';
import { formatDate } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/States';

export function Settings() {
  const db = usePowerSync();
  const { organization } = useOrganization();
  const { data: rates } = useQuery<Database['exchange_rates']>(
    'SELECT * FROM exchange_rates ORDER BY effective_at DESC LIMIT 20'
  );

  const [form, setForm] = useState({ name: '', phone: '', email: '', vat: '15' });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (organization && !loaded) {
      setForm({
        name: organization.name ?? '',
        phone: organization.phone ?? '',
        email: organization.email ?? '',
        vat: organization.default_vat_rate != null ? String(organization.default_vat_rate) : '15'
      });
      setLoaded(true);
    }
  }, [organization, loaded]);

  if (!organization) return <Spinner />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vat = Number(form.vat);
    if (!form.name.trim()) {
      setError('Organization name is required.');
      return;
    }
    if (Number.isNaN(vat) || vat < 0 || vat > 100) {
      setError('VAT must be between 0 and 100.');
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateOrganization(db, organization.id, {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        defaultVatRate: vat
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <form onSubmit={submit} className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ fontWeight: 800, marginBottom: 12 }}>Business profile</div>
        <Field label="Business name *">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Default VAT %">
          <Input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={form.vat}
            onChange={(e) => setForm({ ...form, vat: e.target.value })}
          />
        </Field>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
          Base currency: {organization.currency} (contact support to change — it affects all
          reporting).
        </div>
        {error ? <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p> : null}
        {saved ? <p style={{ color: 'var(--success)', fontSize: '0.85rem' }}>Saved.</p> : null}
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </Button>
      </form>

      <h2 style={{ fontSize: '1.05rem' }}>Exchange rate history</h2>
      {!rates || rates.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          No rates set yet. Set the day&apos;s rate from the Invoices tab.
        </p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Rate (USD/ZiG)</th>
                <th>Effective</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700 }}>{r.official_rate?.toFixed(4)}</td>
                  <td>{formatDate(r.effective_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
