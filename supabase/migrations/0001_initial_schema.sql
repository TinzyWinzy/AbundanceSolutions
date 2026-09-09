-- ============================================================
-- Abundance Solutions - Initial Schema (Supabase PostgreSQL)
-- Offline-first PWA - PowerSync + Supabase
-- ============================================================

-- 1. ORGANIZATIONS (multi-tenant root)
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  phone text,
  email text,
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. PROFILES (extends auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id),
  full_name text not null,
  role text not null default 'field_admin',
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. SITES (physical locations)
create table if not exists sites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name text not null,
  address text,
  latitude decimal(10,8),
  longitude decimal(11,8),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. SITE ASSIGNMENTS
create table if not exists site_assignments (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (site_id, user_id)
);

-- 5. CATEGORIES
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name text not null,
  slug text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (organization_id, slug)
);

-- 6. INVENTORY ASSETS (core product table)
create table if not exists inventory_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  category_id uuid references categories(id),
  name text not null,
  description text,
  sku text,
  price_usd decimal(12,2),
  price_zig decimal(12,2),
  stock_count integer not null default 0,
  min_stock integer not null default 0,
  image_urls text[],
  thumbnail_url text,
  specifications jsonb not null default '{}'::jsonb,
  status text not null default 'available',
  site_id uuid references sites(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. FINANCIAL LOGS
create table if not exists financial_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  site_id uuid references sites(id),
  user_id uuid not null references profiles(id),
  asset_id uuid references inventory_assets(id),
  transaction_type text not null,
  currency text not null,
  amount decimal(12,2) not null,
  description text,
  reference_number text,
  payment_method text,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. ORDERS (WhatsApp checkout bridge)
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  customer_name text,
  customer_phone text,
  status text not null default 'pending',
  total_usd decimal(12,2),
  total_zig decimal(12,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. ORDER ITEMS
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  asset_id uuid not null references inventory_assets(id),
  quantity integer not null default 1,
  unit_price_usd decimal(12,2),
  unit_price_zig decimal(12,2),
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_profiles_org on profiles(organization_id);
create index if not exists idx_sites_org on sites(organization_id);
create index if not exists idx_site_assignments_site on site_assignments(site_id);
create index if not exists idx_site_assignments_user on site_assignments(user_id);
create index if not exists idx_inventory_org on inventory_assets(organization_id);
create index if not exists idx_inventory_category on inventory_assets(category_id);
create index if not exists idx_inventory_site on inventory_assets(site_id);
create index if not exists idx_inventory_status on inventory_assets(status);
create index if not exists idx_financial_logs_org on financial_logs(organization_id);
create index if not exists idx_financial_logs_user on financial_logs(user_id);
create index if not exists idx_financial_logs_site on financial_logs(site_id);
create index if not exists idx_financial_logs_date on financial_logs(logged_at);
create index if not exists idx_orders_org on orders(organization_id);
create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_categories_org on categories(organization_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table sites enable row level security;
alter table site_assignments enable row level security;
alter table categories enable row level security;
alter table inventory_assets enable row level security;
alter table financial_logs enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Helper: current user's organization id
create or replace function public.current_user_org()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from profiles where id = auth.uid()
$$;

-- Helper: is current user an admin (owner/admin/field_admin)
create or replace function public.is_org_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role in ('owner', 'admin', 'field_admin')
  )
$$;

-- Profiles: users read their own + org peers
drop policy if exists "profiles_read" on profiles;
create policy "profiles_read" on profiles for select
  using (id = auth.uid() or organization_id = public.current_user_org());

drop policy if exists "profiles_update" on profiles;
create policy "profiles_update" on profiles for update
  using (id = auth.uid());

-- Organizations: org members read their org
drop policy if exists "organizations_read" on organizations;
create policy "organizations_read" on organizations for select
  using (id = public.current_user_org());

-- Categories: public read (catalog labels), org members write
drop policy if exists "categories_read" on categories;
create policy "categories_read" on categories for select using (true);

drop policy if exists "categories_write" on categories;
create policy "categories_write" on categories for all
  using (organization_id = public.current_user_org())
  with check (organization_id = public.current_user_org());

-- Sites: org members read
drop policy if exists "sites_read" on sites;
create policy "sites_read" on sites for select
  using (organization_id = public.current_user_org());

drop policy if exists "sites_write" on sites;
create policy "sites_write" on sites for all
  using (organization_id = public.current_user_org())
  with check (organization_id = public.current_user_org());

-- Site assignments: org members read
drop policy if exists "site_assignments_read" on site_assignments;
create policy "site_assignments_read" on site_assignments for select
  using (
    site_id in (select id from sites where organization_id = public.current_user_org())
  );

-- Inventory: public sees available stock; org members see everything
drop policy if exists "inventory_read" on inventory_assets;
create policy "inventory_read" on inventory_assets for select
  using (
    status = 'available'
    or organization_id = public.current_user_org()
  );

drop policy if exists "inventory_write" on inventory_assets;
create policy "inventory_write" on inventory_assets for all
  using (organization_id = public.current_user_org())
  with check (organization_id = public.current_user_org());

-- Financial logs: org members read/write
drop policy if exists "financial_logs_read" on financial_logs;
create policy "financial_logs_read" on financial_logs for select
  using (organization_id = public.current_user_org());

drop policy if exists "financial_logs_write" on financial_logs;
create policy "financial_logs_write" on financial_logs for insert
  with check (organization_id = public.current_user_org());

drop policy if exists "financial_logs_update" on financial_logs;
create policy "financial_logs_update" on financial_logs for update
  using (organization_id = public.current_user_org());

-- Orders: org members read; authenticated users can create (WhatsApp checkout)
drop policy if exists "orders_read" on orders;
create policy "orders_read" on orders for select
  using (organization_id = public.current_user_org());

drop policy if exists "orders_insert" on orders;
create policy "orders_insert" on orders for insert
  with check (auth.uid() is not null);

-- Order items: follow parent order
drop policy if exists "order_items_read" on order_items;
create policy "order_items_read" on order_items for select
  using (
    order_id in (
      select id from orders where organization_id = public.current_user_org()
    )
  );

drop policy if exists "order_items_insert" on order_items;
create policy "order_items_insert" on order_items for insert
  with check (auth.uid() is not null);

-- ============================================================
-- DATA API GRANTS (Supabase 2026+ requires explicit grants)
-- ============================================================
grant usage on schema public to anon, authenticated, service_role;

-- Public catalog read (anon)
grant select on categories, inventory_assets to anon;

-- Authenticated access (gated by RLS)
grant select, insert, update, delete on
  organizations, profiles, sites, site_assignments, categories,
  inventory_assets, financial_logs, orders, order_items
  to authenticated;

grant select, insert, update, delete on
  organizations, profiles, sites, site_assignments, categories,
  inventory_assets, financial_logs, orders, order_items
  to service_role;

-- ============================================================
-- POWERSYNC ROLE + PUBLICATION
-- ============================================================
-- Create a dedicated replication role (set a strong password in production).
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'powersync_role') then
    create role powersync_role with replication bypassrls login password 'change-me-in-production';
  end if;
end $$;

grant connect on database postgres to powersync_role;
grant usage on schema public to powersync_role;
grant select on all tables in schema public to powersync_role;
alter default privileges in schema public grant select on tables to powersync_role;

-- Publish only app tables (avoids replicating auth/supabase internals).
drop publication if exists powersync;
create publication powersync for table
  organizations, profiles, sites, site_assignments, categories,
  inventory_assets, financial_logs, orders, order_items;

-- ============================================================
-- SEED DATA (public catalog)
-- ============================================================
do $$
declare
  org_id uuid;
begin
  insert into organizations (id, name, slug, currency)
  values ('00000000-0000-0000-0000-000000000001', 'Abundance Solutions', 'abundance', 'USD')
  on conflict (slug) do nothing;

  select id into org_id from organizations where slug = 'abundance';

  insert into categories (id, organization_id, name, slug, sort_order) values
    ('00000000-0000-0000-0000-000000000010', org_id, 'Generators', 'generators', 1),
    ('00000000-0000-0000-0000-000000000011', org_id, 'Excavators', 'excavators', 2),
    ('00000000-0000-0000-0000-000000000012', org_id, 'Concrete Mixers', 'concrete-mixers', 3),
    ('00000000-0000-0000-0000-000000000013', org_id, 'Grinders', 'grinders', 4)
  on conflict (organization_id, slug) do nothing;

  insert into inventory_assets
    (id, organization_id, category_id, name, description, sku, price_usd, price_zig, stock_count, min_stock, status)
  values
    ('00000000-0000-0000-0000-000000000100', org_id, '00000000-0000-0000-0000-000000000010', 'Generator 15kVA', 'Reliable 15kVA diesel generator for site power.', 'GEN-15', 1200.00, 15600.00, 4, 1, 'available'),
    ('00000000-0000-0000-0000-000000000101', org_id, '00000000-0000-0000-0000-000000000010', 'Generator 30kVA', 'Heavy-duty 30kVA generator for large sites.', 'GEN-30', 2600.00, 33800.00, 2, 1, 'available'),
    ('00000000-0000-0000-0000-000000000102', org_id, '00000000-0000-0000-0000-000000000011', 'Excavator JCB 3CX', 'Backhoe loader for earthmoving.', 'JCB-3CX', 48000.00, 624000.00, 1, 1, 'available'),
    ('00000000-0000-0000-0000-000000000103', org_id, '00000000-0000-0000-0000-000000000012', 'Concrete Mixer 350L', '350L drum concrete mixer.', 'MIX-350', 850.00, 11050.00, 6, 2, 'available'),
    ('00000000-0000-0000-0000-000000000104', org_id, '00000000-0000-0000-0000-000000000013', 'Angle Grinder 230mm', 'Industrial angle grinder.', 'GRD-230', 95.00, 1235.00, 10, 3, 'available')
  on conflict (id) do nothing;
end $$;
