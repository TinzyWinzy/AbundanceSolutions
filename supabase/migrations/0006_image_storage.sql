-- ============================================================
-- Abundance Solutions - Machinery image storage
-- Public bucket `machinery`: anyone can read (catalog images),
-- only staff roles can write. Deploy-time check: run in the
-- Supabase SQL Editor and report any error (storage schema does
-- not exist in vanilla Postgres, so this file is NOT Docker-validated).
-- Pure ASCII.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('machinery', 'machinery', true)
on conflict (id) do update set public = true;

drop policy if exists "machinery_public_read" on storage.objects;
create policy "machinery_public_read" on storage.objects for select
  using (bucket_id = 'machinery');

drop policy if exists "machinery_staff_insert" on storage.objects;
create policy "machinery_staff_insert" on storage.objects for insert
  with check (
    bucket_id = 'machinery'
    and exists (
      select 1 from profiles
      where id = auth.uid() and role in ('owner', 'admin', 'field_admin')
    )
  );

drop policy if exists "machinery_staff_update" on storage.objects;
create policy "machinery_staff_update" on storage.objects for update
  using (
    bucket_id = 'machinery'
    and exists (
      select 1 from profiles
      where id = auth.uid() and role in ('owner', 'admin', 'field_admin')
    )
  );

drop policy if exists "machinery_staff_delete" on storage.objects;
create policy "machinery_staff_delete" on storage.objects for delete
  using (
    bucket_id = 'machinery'
    and exists (
      select 1 from profiles
      where id = auth.uid() and role in ('owner', 'admin', 'field_admin')
    )
  );
