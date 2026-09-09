-- ============================================================
-- Abundance Solutions - Customer-facing order reference
-- Human-friendly ref (ORD-YYYYMMDD-XXXX) for the success screen,
-- WhatsApp handoff, and admin lookup. Pure ASCII.
-- ============================================================

alter table orders add column if not exists reference text unique;

-- Backfill pre-existing rows (if any) with deterministic refs.
do $$
declare
  r record;
begin
  for r in select id, created_at from orders where reference is null loop
    update orders
      set reference = 'ORD-'
        || to_char(r.created_at, 'YYYYMMDD')
        || '-'
        || upper(substring(replace(r.id::text, '-', '') from 1 for 4))
      where id = r.id;
  end loop;
end $$;
