import { usePowerSync } from '@powersync/react';
import { useState } from 'react';
import { assignSite, createSite, unassignSite, updateProfileRole } from '@/lib/powersync/mutations';
import { useAuth } from '@/hooks/useAuth';
import { useProfiles, useSiteAssignments } from '@/hooks/useOrg';
import { useSites } from '@/hooks/useInventory';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/States';

const ROLES = ['owner', 'admin', 'field_admin'] as const;

export function Team() {
  const db = usePowerSync();
  const { profile, user } = useAuth();
  const { sites } = useSites();
  const { profiles } = useProfiles();
  const { assignments } = useSiteAssignments();

  const [siteName, setSiteName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [assignSiteId, setAssignSiteId] = useState('');
  const [assignUserId, setAssignUserId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isManager = profile?.role === 'owner' || profile?.role === 'admin';
  const assignedUserIds = (siteId: string): string[] =>
    assignments
      .filter((a) => a.site_id === siteId)
      .map((a) => a.user_id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
  const userName = (id: string | null) =>
    profiles.find((p) => p.id === id)?.full_name ?? 'Unknown';

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed.');
    } finally {
      setBusy(false);
    }
  };

  const addSite = () =>
    run(async () => {
      if (!profile || !siteName.trim()) {
        setError('Site name is required.');
        return;
      }
      await createSite(db, profile.organization_id, siteName.trim(), siteAddress.trim() || undefined);
      setSiteName('');
      setSiteAddress('');
    });

  const doAssign = () =>
    run(async () => {
      if (!assignSiteId || !assignUserId) {
        setError('Choose a site and a staff member.');
        return;
      }
      await assignSite(db, assignSiteId, assignUserId);
      setAssignSiteId('');
      setAssignUserId('');
    });

  return (
    <div>
      {!isManager ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Only owners and admins can manage sites and roles. Your sites are listed below.
        </p>
      ) : null}

      <h2 style={{ fontSize: '1.05rem' }}>Sites</h2>
      {sites.length === 0 ? (
        <EmptyState title="No sites yet" message="Add your first yard, shop or depot." />
      ) : (
        <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
          {sites.map((site) => (
            <div className="card" style={{ padding: 14 }} key={site.id}>
              <div style={{ fontWeight: 800 }}>{site.name}</div>
              {site.address ? (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{site.address}</div>
              ) : null}
              <div style={{ fontSize: '0.82rem', marginTop: 6 }}>
                {(assignedUserIds(site.id).length > 0
                  ? assignedUserIds(site.id).map(userName).join(', ')
                  : 'No staff assigned')}
              </div>
              {isManager ? (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                  {assignedUserIds(site.id).map((uid) => (
                    <button
                      key={uid}
                      className="btn btn-ghost"
                      style={{ fontSize: '0.75rem', color: 'var(--danger)' }}
                      disabled={busy}
                      onClick={() =>
                        run(async () => {
                          await unassignSite(db, site.id, uid);
                        })
                      }
                    >
                      ✕ {userName(uid)}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {isManager ? (
        <>
          <div className="card" style={{ padding: 14, marginBottom: 20 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Add site</div>
            <Field label="Site name *">
              <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} />
            </Field>
            <Field label="Address">
              <Input value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} />
            </Field>
            <Button onClick={addSite} disabled={busy}>
              Add site
            </Button>
          </div>

          <div className="card" style={{ padding: 14, marginBottom: 20 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Assign staff to site</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Site">
                <Select value={assignSiteId} onChange={(e) => setAssignSiteId(e.target.value)}>
                  <option value="">— Select —</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Staff">
                <Select value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)}>
                  <option value="">— Select —</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.role})
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Button onClick={doAssign} disabled={busy}>
              Assign
            </Button>
          </div>

          <h2 style={{ fontSize: '1.05rem' }}>Staff roles</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.full_name}</td>
                    <td>
                      <select
                        className="select"
                        style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                        value={p.role ?? 'field_admin'}
                        disabled={busy || p.id === user?.id}
                        title={p.id === user?.id ? 'You cannot change your own role' : undefined}
                        onChange={(e) =>
                          run(async () => {
                            await updateProfileRole(db, p.id, e.target.value);
                          })
                        }
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {error ? <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p> : null}
    </div>
  );
}
