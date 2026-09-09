import { column, Schema, Table } from '@powersync/web';

// ============================================================
// Client-side schema (PowerSync WASM SQLite).
// PowerSync syncs schemaless JSON; these tables are materialized
// as SQLite views. The `id` column is created automatically.
// ============================================================

export const organizations = new Table({
  name: column.text,
  slug: column.text,
  phone: column.text,
  email: column.text,
  currency: column.text,
  default_vat_rate: column.real,
  created_at: column.text,
  updated_at: column.text
});

export const profiles = new Table(
  {
    organization_id: column.text,
    full_name: column.text,
    role: column.text,
    phone: column.text,
    avatar_url: column.text,
    created_at: column.text,
    updated_at: column.text
  },
  { indexes: { org: ['organization_id'] } }
);

export const sites = new Table(
  {
    organization_id: column.text,
    name: column.text,
    address: column.text,
    latitude: column.real,
    longitude: column.real,
    created_at: column.text,
    updated_at: column.text
  },
  { indexes: { org: ['organization_id'] } }
);

export const site_assignments = new Table(
  {
    site_id: column.text,
    user_id: column.text,
    created_at: column.text
  },
  { indexes: { site: ['site_id'], user: ['user_id'] } }
);

export const categories = new Table(
  {
    organization_id: column.text,
    name: column.text,
    slug: column.text,
    sort_order: column.integer,
    created_at: column.text
  },
  { indexes: { org: ['organization_id'] } }
);

export const inventory_assets = new Table(
  {
    organization_id: column.text,
    category_id: column.text,
    name: column.text,
    description: column.text,
    sku: column.text,
    price_usd: column.real,
    price_zig: column.real,
    stock_count: column.integer,
    min_stock: column.integer,
    image_urls: column.text,
    thumbnail_url: column.text,
    specifications: column.text,
    status: column.text,
    site_id: column.text,
    created_at: column.text,
    updated_at: column.text
  },
  {
    indexes: {
      org: ['organization_id'],
      category: ['category_id'],
      site: ['site_id'],
      status: ['status']
    }
  }
);

export const financial_logs = new Table(
  {
    organization_id: column.text,
    site_id: column.text,
    user_id: column.text,
    asset_id: column.text,
    transaction_type: column.text,
    currency: column.text,
    amount: column.real,
    description: column.text,
    reference_number: column.text,
    payment_method: column.text,
    logged_at: column.text,
    created_at: column.text,
    updated_at: column.text
  },
  {
    indexes: {
      org: ['organization_id'],
      user: ['user_id'],
      site: ['site_id'],
      date: ['logged_at']
    }
  }
);

export const orders = new Table(
  {
    organization_id: column.text,
    customer_name: column.text,
    customer_phone: column.text,
    status: column.text,
    total_usd: column.real,
    total_zig: column.real,
    reference: column.text,
    notes: column.text,
    created_at: column.text,
    updated_at: column.text
  },
  {
    indexes: {
      org: ['organization_id'],
      ref: ['reference'],
      status: ['status']
    }
  }
);

export const order_items = new Table(
  {
    order_id: column.text,
    asset_id: column.text,
    quantity: column.integer,
    unit_price_usd: column.real,
    unit_price_zig: column.real,
    created_at: column.text
  },
  { indexes: { order: ['order_id'] } }
);

export const exchange_rates = new Table(
  {
    organization_id: column.text,
    currency_pair: column.text,
    official_rate: column.real,
    effective_at: column.text,
    created_by: column.text,
    created_at: column.text
  },
  { indexes: { org: ['organization_id'] } }
);

export const pro_forma_invoices = new Table(
  {
    organization_id: column.text,
    invoice_number: column.text,
    quotation_id: column.text,
    customer_name: column.text,
    customer_phone: column.text,
    customer_tax_id: column.text,
    subtotal_usd: column.real,
    vat_usd: column.real,
    total_usd: column.real,
    applied_rate_zig: column.real,
    total_zig: column.real,
    status: column.text,
    valid_until: column.text,
    created_by: column.text,
    created_at: column.text,
    updated_at: column.text
  },
  {
    indexes: {
      org: ['organization_id'],
      number: ['invoice_number'],
      status: ['status']
    }
  }
);

export const invoice_line_items = new Table(
  {
    invoice_id: column.text,
    asset_id: column.text,
    description: column.text,
    quantity: column.integer,
    unit_price_usd: column.real,
    total_price_usd: column.real
  },
  { indexes: { invoice: ['invoice_id'] } }
);

export const payment_receipts = new Table(
  {
    organization_id: column.text,
    receipt_number: column.text,
    invoice_id: column.text,
    amount_paid: column.real,
    currency: column.text,
    payment_method: column.text,
    reference_number: column.text,
    collected_by: column.text,
    created_at: column.text
  },
  {
    indexes: {
      org: ['organization_id'],
      invoice: ['invoice_id'],
      number: ['receipt_number']
    }
  }
);

export const AppSchema = new Schema({
  organizations,
  profiles,
  sites,
  site_assignments,
  categories,
  inventory_assets,
  financial_logs,
  orders,
  order_items,
  exchange_rates,
  pro_forma_invoices,
  invoice_line_items,
  payment_receipts
});

export type Database = (typeof AppSchema)['types'];
export type InventoryAsset = Database['inventory_assets'];
export type FinancialLog = Database['financial_logs'];
export type Order = Database['orders'];
export type ExchangeRate = Database['exchange_rates'];
export type ProFormaInvoice = Database['pro_forma_invoices'];
export type InvoiceLineItem = Database['invoice_line_items'];
export type PaymentReceipt = Database['payment_receipts'];
export type Category = Database['categories'];
export type Site = Database['sites'];
export type Profile = Database['profiles'];
