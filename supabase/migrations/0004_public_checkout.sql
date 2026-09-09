-- ============================================================
-- Abundance Solutions - Public checkout hardening
-- DECISION (validated 2026-09-10): anon has NO direct table access.
-- supabase-js always requests RETURNING, which needs SELECT; granting
-- anon SELECT would expose customer PII. Public checkout therefore goes
-- through the `checkout` Edge Function (service_role, server-validated).
-- This migration is a safe no-op on fresh DBs and a cleanup on DBs
-- where the earlier anon-insert draft was applied.
-- Pure ASCII.
-- ============================================================

drop policy if exists "orders_anon_insert" on orders;
drop policy if exists "order_items_anon_insert" on order_items;

revoke insert on orders, order_items from anon;
