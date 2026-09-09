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
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M3 17l6-6 4 4 8-8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15 7h6v6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Abundance
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
