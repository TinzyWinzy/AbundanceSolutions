import type { PowerSyncDatabase } from '@powersync/web';

const uuid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

export interface InventoryInput {
  organizationId: string;
  categoryId: string | null;
  name: string;
  description?: string;
  sku?: string;
  priceUsd: number | null;
  priceZig: number | null;
  stockCount: number;
  minStock?: number;
  status?: string;
  siteId?: string | null;
}

export interface FinancialLogInput {
  organizationId: string;
  userId: string;
  siteId: string | null;
  assetId: string | null;
  transactionType: string;
  currency: string;
  amount: number;
  description?: string;
  referenceNumber?: string;
  paymentMethod: string;
}

export async function createInventoryAsset(db: PowerSyncDatabase, input: InventoryInput) {
  const id = uuid();
  const ts = now();
  await db.execute(
    `INSERT INTO inventory_assets
      (id, organization_id, category_id, name, description, sku, price_usd, price_zig,
       stock_count, min_stock, image_urls, thumbnail_url, specifications, status, site_id,
       created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.organizationId,
      input.categoryId,
      input.name,
      input.description ?? null,
      input.sku ?? null,
      input.priceUsd,
      input.priceZig,
      input.stockCount,
      input.minStock ?? 0,
      '[]',
      null,
      '{}',
      input.status ?? 'available',
      input.siteId ?? null,
      ts,
      ts
    ]
  );
  return id;
}

export async function updateAssetStatus(db: PowerSyncDatabase, id: string, status: string) {
  await db.execute(
    'UPDATE inventory_assets SET status = ?, updated_at = ? WHERE id = ?',
    [status, now(), id]
  );
}

export async function updateStockCount(db: PowerSyncDatabase, id: string, stockCount: number) {
  await db.execute(
    'UPDATE inventory_assets SET stock_count = ?, updated_at = ? WHERE id = ?',
    [stockCount, now(), id]
  );
}

export async function createFinancialLog(db: PowerSyncDatabase, input: FinancialLogInput) {
  const id = uuid();
  const ts = now();
  await db.execute(
    `INSERT INTO financial_logs
      (id, organization_id, site_id, user_id, asset_id, transaction_type, currency, amount,
       description, reference_number, payment_method, logged_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.organizationId,
      input.siteId,
      input.userId,
      input.assetId,
      input.transactionType,
      input.currency,
      input.amount,
      input.description ?? null,
      input.referenceNumber ?? null,
      input.paymentMethod,
      ts,
      ts,
      ts
    ]
  );
  return id;
}
