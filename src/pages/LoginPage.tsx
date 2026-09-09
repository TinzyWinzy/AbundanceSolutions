import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';

export function LoginPage() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 420, margin: '40px auto', padding: 28 }}>
      <h1 style={{ margin: '0 0 4px', fontSize: '1.3rem' }}>Admin sign in</h1>
      <p style={{ color: 'var(--text-muted)', marginTop: 0, marginBottom: 20 }}>
        Access the field operations suite.
      </p>

      <form onSubmit={handleSubmit}>
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </Field>

        {error ? <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p> : null}

        <Button type="submit" block disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      {import.meta.env.DEV ? <DemoPinAccess /> : null}
    </div>
  );
}

/**
 * DEV-ONLY test-admin shortcut. Entirely removed from production builds
 * (import.meta.env.DEV is false in `vite build`, branch dropped).
 * PIN + demo credentials come from gitignored .env.local.
 */
function DemoPinAccess() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const configured =
    (import.meta.env.VITE_DEMO_PIN ?? '') !== '' &&
    (import.meta.env.VITE_DEMO_EMAIL ?? '') !== '' &&
    (import.meta.env.VITE_DEMO_PASSWORD ?? '') !== '';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pin !== import.meta.env.VITE_DEMO_PIN) {
      setError('Wrong PIN.');
      return;
    }
    setLoading(true);
    try {
      await signIn(
        import.meta.env.VITE_DEMO_EMAIL as string,
        import.meta.env.VITE_DEMO_PASSWORD as string
      );
      navigate('/admin');
    } catch (err) {
      setError(
        err instanceof Error
          ? `Demo sign-in failed: ${err.message}. Create the demo user in Supabase first.`
          : 'Demo sign-in failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        marginTop: 20,
        paddingTop: 16,
        borderTop: '1px dashed var(--border)'
      }}
    >
      <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: 4 }}>
        Test access (dev only)
      </div>
      {!configured ? (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
          Set VITE_DEMO_PIN, VITE_DEMO_EMAIL and VITE_DEMO_PASSWORD in .env.local to enable
          PIN login.
        </p>
      ) : (
        <form onSubmit={submit}>
          <Field label="Test admin PIN" htmlFor="demo-pin">
            <Input
              id="demo-pin"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoComplete="off"
            />
          </Field>
          {error ? (
            <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p>
          ) : null}
          <Button type="submit" variant="secondary" block disabled={loading}>
            {loading ? 'Signing in…' : 'Unlock test admin'}
          </Button>
        </form>
      )}
    </div>
  );
}
