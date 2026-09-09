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
  thumbnailUrl?: string | null;
  imageUrls?: string | null;
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
      input.imageUrls ?? '[]',
      input.thumbnailUrl ?? null,
      '{}',
      input.status ?? 'available',
      input.siteId ?? null,
      ts,
      ts
    ]
  );
  return id;
}

export interface InventoryUpdate {
  categoryId: string | null;
  name: string;
  description?: string;
  sku?: string;
  priceUsd: number | null;
  priceZig: number | null;
  stockCount: number;
  minStock: number;
  status: string;
  siteId: string | null;
  thumbnailUrl: string | null;
  imageUrls: string;
}

export async function updateInventoryAsset(
  db: PowerSyncDatabase,
  id: string,
  input: InventoryUpdate
) {
  await db.execute(
    `UPDATE inventory_assets SET
      category_id = ?, name = ?, description = ?, sku = ?,
      price_usd = ?, price_zig = ?, stock_count = ?, min_stock = ?,
      thumbnail_url = ?, image_urls = ?, status = ?, site_id = ?,
      updated_at = ?
     WHERE id = ?`,
    [
      input.categoryId,
      input.name,
      input.description ?? null,
      input.sku ?? null,
      input.priceUsd,
      input.priceZig,
      input.stockCount,
      input.minStock,
      input.thumbnailUrl,
      input.imageUrls,
      input.status,
      input.siteId,
      now(),
      id
    ]
  );
}

export async function deleteInventoryAsset(db: PowerSyncDatabase, id: string) {
  await db.execute('DELETE FROM inventory_assets WHERE id = ?', [id]);
}

/** Counts local references that would block deletion (history protection). */
export async function countAssetReferences(
  db: PowerSyncDatabase,
  id: string
): Promise<{ orderItems: number; lineItems: number; financialLogs: number }> {
  const [orderItems, lineItems, financialLogs] = await Promise.all([
    db.getAll<{ n: number }>('SELECT COUNT(*) AS n FROM order_items WHERE asset_id = ?', [id]),
    db.getAll<{ n: number }>('SELECT COUNT(*) AS n FROM invoice_line_items WHERE asset_id = ?', [id]),
    db.getAll<{ n: number }>('SELECT COUNT(*) AS n FROM financial_logs WHERE asset_id = ?', [id])
  ]);
  return {
    orderItems: orderItems[0]?.n ?? 0,
    lineItems: lineItems[0]?.n ?? 0,
    financialLogs: financialLogs[0]?.n ?? 0
  };
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

export interface ReceiptWithLogInput extends ReceiptInput {
  invoiceNumber: string;
}

/**
 * Records a payment receipt AND mirrors it into financial_logs in one
 * write transaction, so the two money books stay consistent and upload
 * atomically. reference_number links the log row back to the receipt.
 */
export async function recordReceiptWithLog(db: PowerSyncDatabase, input: ReceiptWithLogInput) {
  const receiptId = uuid();
  const ts = now();

  await db.writeTransaction(async (tx) => {
    await tx.execute(
      `INSERT INTO payment_receipts
        (id, organization_id, receipt_number, invoice_id, amount_paid, currency,
         payment_method, reference_number, collected_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        receiptId,
        input.organizationId,
        input.receiptNumber,
        input.invoiceId,
        input.amount,
        input.currency,
        input.paymentMethod,
        input.referenceNumber ?? null,
        input.userId,
        ts
      ]
    );

    await tx.execute(
      `INSERT INTO financial_logs
        (id, organization_id, site_id, user_id, asset_id, transaction_type, currency, amount,
         description, reference_number, payment_method, logged_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuid(),
        input.organizationId,
        null,
        input.userId,
        null,
        'sale',
        input.currency,
        input.amount,
        `Receipt ${input.receiptNumber} - invoice ${input.invoiceNumber}`,
        input.receiptNumber,
        input.paymentMethod,
        ts,
        ts,
        ts
      ]
    );
  });

  return receiptId;
}

export interface DeliveryLine {
  assetId: string | null;
  quantity: number;
}

/**
 * Marks an order delivered and decrements stock once. Callers must only
 * invoke this on the transition INTO delivered (guard lives in UI).
 * Stock is clamped at zero, never negative.
 */
export async function deliverOrder(
  db: PowerSyncDatabase,
  orderId: string,
  lines: DeliveryLine[]
) {
  const ts = now();
  await db.writeTransaction(async (tx) => {
    await tx.execute('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?', [
      'delivered',
      ts,
      orderId
    ]);
    for (const line of lines) {
      if (!line.assetId) continue;
      await tx.execute(
        'UPDATE inventory_assets SET stock_count = max(0, stock_count - ?), updated_at = ? WHERE id = ?',
        [line.quantity, ts, line.assetId]
      );
    }
  });
}

export async function createSite(
  db: PowerSyncDatabase,
  organizationId: string,
  name: string,
  address?: string
) {
  const id = uuid();
  await db.execute(
    'INSERT INTO sites (id, organization_id, name, address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, organizationId, name, address ?? null, now(), now()]
  );
  return id;
}

export async function assignSite(db: PowerSyncDatabase, siteId: string, userId: string) {
  const id = uuid();
  await db.execute(
    'INSERT INTO site_assignments (id, site_id, user_id, created_at) VALUES (?, ?, ?, ?)',
    [id, siteId, userId, now()]
  );
  return id;
}

export async function unassignSite(db: PowerSyncDatabase, siteId: string, userId: string) {
  await db.execute('DELETE FROM site_assignments WHERE site_id = ? AND user_id = ?', [
    siteId,
    userId
  ]);
}

export async function updateProfileRole(db: PowerSyncDatabase, userId: string, role: string) {
  await db.execute('UPDATE profiles SET role = ?, updated_at = ? WHERE id = ?', [
    role,
    now(),
    userId
  ]);
}

export interface OrgUpdate {
  name: string;
  phone?: string;
  email?: string;
  defaultVatRate: number;
}

export async function updateOrganization(
  db: PowerSyncDatabase,
  id: string,
  input: OrgUpdate
) {
  await db.execute(
    'UPDATE organizations SET name = ?, phone = ?, email = ?, default_vat_rate = ?, updated_at = ? WHERE id = ?',
    [input.name, input.phone ?? null, input.email ?? null, input.defaultVatRate, now(), id]
  );
}
