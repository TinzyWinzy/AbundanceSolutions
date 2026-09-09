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

export interface InvoiceLineInput {
  assetId: string | null;
  description: string;
  quantity: number;
  unitPriceUsd: number;
}

export interface InvoiceInput {
  organizationId: string;
  userId: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerTaxId?: string;
  lines: InvoiceLineInput[];
  vatUsd: number;
  appliedRateZig: number;
  validUntil: string;
}

/**
 * Creates an invoice and its line items in a single write transaction so
 * they share one CRUD transaction id and upload atomically (FK-safe).
 */
export async function createInvoice(db: PowerSyncDatabase, input: InvoiceInput) {
  const subtotalUsd = round2(
    input.lines.reduce((s, l) => s + l.quantity * l.unitPriceUsd, 0)
  );
  const totalUsd = round2(subtotalUsd + input.vatUsd);
  const totalZig = round2(totalUsd * input.appliedRateZig);

  const id = uuid();
  const ts = now();

  await db.writeTransaction(async (tx) => {
    await tx.execute(
      `INSERT INTO pro_forma_invoices
        (id, organization_id, invoice_number, customer_name, customer_phone,
         customer_tax_id, subtotal_usd, vat_usd, total_usd, applied_rate_zig,
         total_zig, status, valid_until, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'issued', ?, ?, ?, ?)`,
      [
        id,
        input.organizationId,
        input.invoiceNumber,
        input.customerName,
        input.customerPhone,
        input.customerTaxId ?? null,
        subtotalUsd,
        input.vatUsd,
        totalUsd,
        input.appliedRateZig,
        totalZig,
        input.validUntil,
        input.userId,
        ts,
        ts
      ]
    );

    for (const line of input.lines) {
      await tx.execute(
        `INSERT INTO invoice_line_items
          (id, invoice_id, asset_id, description, quantity, unit_price_usd, total_price_usd)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          uuid(),
          id,
          line.assetId,
          line.description,
          line.quantity,
          line.unitPriceUsd,
          round2(line.quantity * line.unitPriceUsd)
        ]
      );
    }
  });

  return id;
}

const ORDER_STATUSES = ['pending', 'confirmed', 'delivered', 'cancelled'] as const;

export async function updateOrderStatus(db: PowerSyncDatabase, id: string, status: string) {
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) {
    throw new Error('Invalid order status');
  }
  await db.execute('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?', [
    status,
    now(),
    id
  ]);
}

export async function cancelInvoice(db: PowerSyncDatabase, id: string) {
  await db.execute(
    "UPDATE pro_forma_invoices SET status = 'cancelled', updated_at = ? WHERE id = ? AND status IN ('draft', 'issued')",
    [now(), id]
  );
}

export interface ReceiptInput {
  organizationId: string;
  userId: string;
  invoiceId: string;
  receiptNumber: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  referenceNumber?: string;
}

export async function recordReceipt(db: PowerSyncDatabase, input: ReceiptInput) {
  const id = uuid();
  await db.execute(
    `INSERT INTO payment_receipts
      (id, organization_id, receipt_number, invoice_id, amount_paid, currency,
       payment_method, reference_number, collected_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.organizationId,
      input.receiptNumber,
      input.invoiceId,
      input.amount,
      input.currency,
      input.paymentMethod,
      input.referenceNumber ?? null,
      input.userId,
      now()
    ]
  );
  return id;
}

export async function saveExchangeRate(
  db: PowerSyncDatabase,
  organizationId: string,
  userId: string,
  rate: number
) {
  const id = uuid();
  const ts = now();
  await db.execute(
    `INSERT INTO exchange_rates
      (id, organization_id, currency_pair, effective_at, official_rate, created_by, created_at)
     VALUES (?, ?, 'USD_ZIG', ?, ?, ?, ?)`,
    [id, organizationId, ts, rate, userId, ts]
  );
  return id;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
