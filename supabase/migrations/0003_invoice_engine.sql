-- ============================================================
-- Abundance Solutions - Pro-Forma Invoice and Receipt Engine
-- Adapted to stack: org-scoped, asset FK (no products table),
-- lowercase enums matching app constants, PowerSync publication.
-- Pure ASCII. Idempotent where safe (policies/funcs/triggers).
-- ============================================================

-- 1. EXCHANGE RATES (per org, append-only log of daily rates)
create table if not exists exchange_rates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  currency_pair text not null default 'USD_ZIG',
  official_rate decimal(10,4) not null check (official_rate > 0),
  effective_at timestamptz not null default now(),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- 2. PRO-FORMA INVOICES
create table if not exists pro_forma_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  invoice_number text unique not null,
  quotation_id uuid,
  customer_name text not null,
  customer_phone text not null,
  customer_tax_id text,
  subtotal_usd decimal(12,2) not null check (subtotal_usd >= 0),
  vat_usd decimal(12,2) not null default 0.00 check (vat_usd >= 0),
  total_usd decimal(12,2) not null check (total_usd >= 0),
  applied_rate_zig decimal(10,4) not null check (applied_rate_zig > 0),
  total_zig decimal(14,2) not null check (total_zig >= 0),
  status text not null default 'draft'
    check (status in ('draft', 'issued', 'partially_paid', 'paid', 'cancelled')),
  valid_until timestamptz not null,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. INVOICE LINE ITEMS (asset FK; description snapshot at issue time)
create table if not exists invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references pro_forma_invoices(id) on delete cascade,
  asset_id uuid references inventory_assets(id),
  description text not null,
  quantity integer not null check (quantity > 0),
  unit_price_usd decimal(12,2) not null check (unit_price_usd >= 0),
  total_price_usd decimal(12,2) not null check (total_price_usd >= 0)
);

-- 4. PAYMENT RECEIPTS (append-only ledger: insert + select only)
create table if not exists payment_receipts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  receipt_number text unique not null,
  invoice_id uuid not null references pro_forma_invoices(id),
  amount_paid decimal(12,2) not null check (amount_paid > 0),
  currency text not null check (currency in ('USD', 'ZiG')),
  payment_method text not null check (payment_method in ('cash', 'ecocash', 'bank_transfer', 'zig')),
  reference_number text,
  collected_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_rates_org on exchange_rates(organization_id);
create index if not exists idx_rates_effective on exchange_rates(effective_at desc);
create index if not exists idx_pfi_org on pro_forma_invoices(organization_id);
create index if not exists idx_pfi_number on pro_forma_invoices(invoice_number);
create index if not exists idx_pfi_status on pro_forma_invoices(status);
create index if not exists idx_pfi_customer on pro_forma_invoices(customer_phone);
create index if not exists idx_items_invoice on invoice_line_items(invoice_id);
create index if not exists idx_receipts_invoice on payment_receipts(invoice_id);
create index if not exists idx_receipts_org on payment_receipts(organization_id);
create index if not exists idx_receipts_number on payment_receipts(receipt_number);

-- ============================================================
-- ROW LEVEL SECURITY (org-scoped; receipts append-only)
-- ============================================================
alter table exchange_rates enable row level security;
alter table pro_forma_invoices enable row level security;
alter table invoice_line_items enable row level security;
alter table payment_receipts enable row level security;

drop policy if exists "rates_read" on exchange_rates;
create policy "rates_read" on exchange_rates for select
  using (organization_id = public.current_user_org());

drop policy if exists "rates_write" on exchange_rates;
create policy "rates_write" on exchange_rates for insert
  with check (organization_id = public.current_user_org());

drop policy if exists "pfi_read" on pro_forma_invoices;
create policy "pfi_read" on pro_forma_invoices for select
  using (organization_id = public.current_user_org());

drop policy if exists "pfi_write" on pro_forma_invoices;
create policy "pfi_write" on pro_forma_invoices for all
  using (organization_id = public.current_user_org())
  with check (organization_id = public.current_user_org());

drop policy if exists "items_read" on invoice_line_items;
create policy "items_read" on invoice_line_items for select
  using (
    invoice_id in (
      select id from pro_forma_invoices
      where organization_id = public.current_user_org()
    )
  );

drop policy if exists "items_write" on invoice_line_items;
create policy "items_write" on invoice_line_items for all
  using (
    invoice_id in (
      select id from pro_forma_invoices
      where organization_id = public.current_user_org()
    )
  )
  with check (
    invoice_id in (
      select id from pro_forma_invoices
      where organization_id = public.current_user_org()
    )
  );

drop policy if exists "receipts_read" on payment_receipts;
create policy "receipts_read" on payment_receipts for select
  using (organization_id = public.current_user_org());

drop policy if exists "receipts_insert" on payment_receipts;
create policy "receipts_insert" on payment_receipts for insert
  with check (organization_id = public.current_user_org());

-- ============================================================
-- DATA API GRANTS (authenticated only; no anon on financials)
-- ============================================================
grant select, insert, update, delete on
  exchange_rates, pro_forma_invoices, invoice_line_items
  to authenticated;

grant select, insert on payment_receipts to authenticated;

grant select, insert, update, delete on
  exchange_rates, pro_forma_invoices, invoice_line_items, payment_receipts
  to service_role;

-- ============================================================
-- TRIGGER: auto-update invoice status on receipt insert
-- ZiG receipts converted via the invoice's own applied_rate_zig.
-- ============================================================
create or replace function update_invoice_payment_status()
returns trigger as $$
declare
  total_received numeric(12,2);
  target_total numeric(12,2);
  rate numeric(10,4);
begin
  select total_usd, applied_rate_zig
    into target_total, rate
    from pro_forma_invoices
    where id = new.invoice_id;

  if target_total is null then
    return new;
  end if;

  select coalesce(sum(
    case
      when currency = 'USD' then amount_paid
      else amount_paid / rate
    end
  ), 0) into total_received
  from payment_receipts
  where invoice_id = new.invoice_id;

  if total_received >= target_total then
    update pro_forma_invoices
      set status = 'paid', updated_at = now()
      where id = new.invoice_id;
  elsif total_received > 0 then
    update pro_forma_invoices
      set status = 'partially_paid', updated_at = now()
      where id = new.invoice_id;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_invoice_status on payment_receipts;
create trigger trigger_update_invoice_status
after insert on payment_receipts
for each row execute function update_invoice_payment_status();

-- ============================================================
-- POWERSYNC: replicate the new tables (role already has SELECT
-- via default privileges granted in 0001).
-- ============================================================
alter publication powersync add table
  exchange_rates, pro_forma_invoices, invoice_line_items, payment_receipts;
