import { usePowerSync } from '@powersync/react';
import { useState } from 'react';
import type { Category, InventoryAsset, Site } from '@/lib/powersync/AppSchema';
import {
  countAssetReferences,
  deleteInventoryAsset,
  updateInventoryAsset
} from '@/lib/powersync/mutations';
import { uploadMachineImage } from '@/lib/storage/uploadImage';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { ImagePicker } from './ImagePicker';
import { ASSET_STATUSES } from '@/utils/constants';

interface InventoryEditFormProps {
  asset: InventoryAsset;
  categories: Category[];
  sites: Site[];
  onDone: () => void;
}

export function InventoryEditForm({ asset, categories, sites, onDone }: InventoryEditFormProps) {
  const db = usePowerSync();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: asset.name ?? '',
    categoryId: asset.category_id ?? '',
    description: asset.description ?? '',
    sku: asset.sku ?? '',
    priceUsd: asset.price_usd != null ? String(asset.price_usd) : '',
    priceZig: asset.price_zig != null ? String(asset.price_zig) : '',
    stockCount: String(asset.stock_count ?? 0),
    minStock: String(asset.min_stock ?? 0),
    status: asset.status ?? 'available',
    siteId: asset.site_id ?? ''
  });
  // null = untouched, File = replace, 'REMOVE' = strip photo
  const [photo, setPhoto] = useState<File | 'REMOVE' | null>(null);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handlePhoto = (file: File | null) => {
    // Null after picking a new file means "drop the pick, keep existing".
    // Null with no pick in flight means "strip the existing photo".
    if (file) {
      setPhoto(file);
    } else {
      setPhoto((prev) => (prev instanceof File ? null : asset.thumbnail_url ? 'REMOVE' : null));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let thumbnailUrl = asset.thumbnail_url;
      let imageUrls = asset.image_urls ?? '[]';
      if (photo instanceof File) {
        const url = await uploadMachineImage(photo);
        thumbnailUrl = url;
        imageUrls = JSON.stringify([url]);
      } else if (photo === 'REMOVE') {
        thumbnailUrl = null;
        imageUrls = '[]';
      }
      await updateInventoryAsset(db, asset.id, {
        categoryId: form.categoryId || null,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        sku: form.sku.trim() || undefined,
        priceUsd: form.priceUsd ? Number(form.priceUsd) : null,
        priceZig: form.priceZig ? Number(form.priceZig) : null,
        stockCount: Number(form.stockCount) || 0,
        minStock: Number(form.minStock) || 0,
        status: form.status,
        siteId: form.siteId || null,
        thumbnailUrl,
        imageUrls
      });
      toast('Changes saved');
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${asset.name}" permanently?`)) return;
    setDeleting(true);
    setError(null);
    try {
      const refs = await countAssetReferences(db, asset.id);
      const total = refs.orderItems + refs.lineItems + refs.financialLogs;
      if (total > 0) {
        setError(
          `Cannot delete: this item appears in ${refs.orderItems} order(s), ` +
            `${refs.lineItems} invoice line(s) and ${refs.financialLogs} transaction(s). ` +
            `Set its status to "sold" instead to preserve history.`
        );
        return;
      }
      await deleteInventoryAsset(db, asset.id);
      toast(`“${asset.name}” deleted`);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete.');
    } finally {
      setDeleting(false);
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="Stock">
          <Input
            type="number"
            min="0"
            value={form.stockCount}
            onChange={(e) => set('stockCount')(e.target.value)}
          />
        </Field>
        <Field label="Low-stock at">
          <Input
            type="number"
            min="0"
            value={form.minStock}
            onChange={(e) => set('minStock')(e.target.value)}
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

      <ImagePicker
        currentUrl={photo === 'REMOVE' ? null : (asset.thumbnail_url ?? null)}
        onFile={handlePhoto}
      />

      {error ? <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p> : null}

      <div style={{ display: 'flex', gap: 8 }}>
        <Button type="submit" disabled={saving || deleting} style={{ flex: 1 }}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={saving || deleting}
          onClick={handleDelete}
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
      </div>
    </form>
  );
}
