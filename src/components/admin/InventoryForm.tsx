import { usePowerSync } from '@powersync/react';
import { useState } from 'react';
import type { Category, Site } from '@/lib/powersync/AppSchema';
import { createInventoryAsset } from '@/lib/powersync/mutations';
import { uploadMachineImage } from '@/lib/storage/uploadImage';
import { toast } from '@/lib/toast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { ImagePicker } from './ImagePicker';
import { ASSET_STATUSES } from '@/utils/constants';

interface InventoryFormProps {
  categories: Category[];
  sites: Site[];
  onDone: () => void;
}

export function InventoryForm({ categories, sites, onDone }: InventoryFormProps) {
  const db = usePowerSync();
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    description: '',
    sku: '',
    priceUsd: '',
    priceZig: '',
    stockCount: '0',
    status: 'available',
    siteId: ''
  });
  const [photo, setPhoto] = useState<File | null>(null);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      setError('You must be signed in to add equipment.');
      return;
    }
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      let thumbnailUrl: string | null = null;
      let imageUrls = '[]';
      if (photo) {
        if (!navigator.onLine) {
          // Offline: save the listing now, photo can be added on edit later.
        } else {
          thumbnailUrl = await uploadMachineImage(photo);
          imageUrls = JSON.stringify([thumbnailUrl]);
        }
      }
      await createInventoryAsset(db, {
        organizationId: profile.organization_id,
        categoryId: form.categoryId || null,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        sku: form.sku.trim() || undefined,
        priceUsd: form.priceUsd ? Number(form.priceUsd) : null,
        priceZig: form.priceZig ? Number(form.priceZig) : null,
        stockCount: Number(form.stockCount) || 0,
        status: form.status,
        siteId: form.siteId || null,
        thumbnailUrl,
        imageUrls
      });
      toast(`“${form.name.trim()}” added to stock`);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Name *">
        <Input value={form.name} onChange={(e) => set('name')(e.target.value)} required />
      </Field>

      <Field label="Category">
        <Select value={form.categoryId} onChange={(e) => set('categoryId')(e.target.value)}>
          <option value="">— Select —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Description">
        <Textarea
          value={form.description}
          onChange={(e) => set('description')(e.target.value)}
          rows={3}
        />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Price (USD)">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.priceUsd}
            onChange={(e) => set('priceUsd')(e.target.value)}
          />
        </Field>
        <Field label="Price (ZiG)">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.priceZig}
            onChange={(e) => set('priceZig')(e.target.value)}
          />
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Stock count">
          <Input
            type="number"
            min="0"
            value={form.stockCount}
            onChange={(e) => set('stockCount')(e.target.value)}
          />
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => set('status')(e.target.value)}>
            {ASSET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
      </div>

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

      <Field label="SKU">
        <Input value={form.sku} onChange={(e) => set('sku')(e.target.value)} />
      </Field>

      <ImagePicker currentUrl={null} onFile={setPhoto} />

      {error ? <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p> : null}

      <Button type="submit" block disabled={saving}>
        {saving ? 'Saving…' : 'Save equipment'}
      </Button>
    </form>
  );
}
