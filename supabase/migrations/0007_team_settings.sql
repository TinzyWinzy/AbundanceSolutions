-- ============================================================
-- Abundance Solutions - Team management + org settings
-- Staff site assignments (writes), admin role editing, and a
-- per-org default VAT rate. Pure ASCII.
-- ============================================================

alter table organizations add column if not exists default_vat_rate numeric(5,2) not null default 15.00;

-- Site assignments: admins manage, members read (read policy exists).
drop policy if exists "site_assignments_write" on site_assignments;
create policy "site_assignments_write" on site_assignments for all
  using (
    site_id in (
      select s.id from sites s
      join profiles p on p.organization_id = s.organization_id
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  )
  with check (
    site_id in (
      select s.id from sites s
      join profiles p on p.organization_id = s.organization_id
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

-- Profiles: org admins (owner/admin) can update member roles.
-- Self-update policy ("profiles_update") already exists.
drop policy if exists "profiles_admin_update" on profiles;
create policy "profiles_admin_update" on profiles for update
  using (
    organization_id in (
      select organization_id from profiles
      where id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- Organizations: org admins can update their org profile.
drop policy if exists "organizations_write" on organizations;
create policy "organizations_write" on organizations for update
  using (id = public.current_user_org())
  with check (id = public.current_user_org());
