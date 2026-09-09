import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { BandwidthToggle } from './BandwidthToggle';
import { OfflineIndicator } from './OfflineIndicator';

export function AppHeader() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="app-header">
      <div className="container app-header__inner">
        <Link to="/" className="app-header__brand">
          <img
            src="/logo.jpg"
            alt="Abundance Solutions"
            style={{ height: 38, borderRadius: 6, display: 'block' }}
          />
        </Link>

        <nav style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <OfflineIndicator />
          <BandwidthToggle />

          {isAdmin ? (
            <Link to="/admin" className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>
              Dashboard
            </Link>
          ) : null}

          {!loading &&
            (user ? (
              <button className="btn btn-secondary" onClick={handleSignOut}>
                Sign out
              </button>
            ) : (
              <Link to="/login" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                Admin login
              </Link>
            ))}
        </nav>
      </div>
    </header>
  );
}
