import { useQuery } from '@powersync/react';
import type { Database } from '@/lib/powersync/AppSchema';

export function useOrganization() {
  const { data } = useQuery<Database['organizations']>(
    'SELECT * FROM organizations LIMIT 1'
  );
  return { organization: data?.[0] ?? null };
}

export function useProfiles() {
  const { data: profiles } = useQuery<Database['profiles']>(
    'SELECT * FROM profiles ORDER BY full_name ASC'
  );
  return { profiles: profiles ?? [] };
}

export function useSiteAssignments() {
  const { data: assignments } = useQuery<Database['site_assignments']>(
    'SELECT * FROM site_assignments'
  );
  return { assignments: assignments ?? [] };
}
