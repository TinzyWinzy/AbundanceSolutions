import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/stores/cart';
import { BandwidthToggle } from './BandwidthToggle';
import { OfflineIndicator, OfflineStrip } from './OfflineIndicator';

function navClass({ isActive }: { isActive: boolean }): string {
  return `nav-link${isActive ? ' active' : ''}`;
}

export function AppHeader() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const cartCount = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="app-header">
      <div className="container app-header__inner">
        <Link to="/" className="app-header__brand" aria-label="Abundance Solutions home">
          <img
            src="/logo.jpg"
            alt="Abundance Solutions"
            style={{ height: 38, borderRadius: 6, display: 'block' }}
          />
        </Link>

        <nav className="main-nav" aria-label="Primary">
          <NavLink to="/" end className={navClass}>
            Home
          </NavLink>
          <NavLink to="/store" className={navClass}>
            Store
          </NavLink>
          <NavLink to="/enquire" className={navClass}>
            Finder
          </NavLink>
        </nav>

        <div className="app-header__actions">
          <OfflineIndicator />
          <BandwidthToggle />
          <Link
            to="/checkout"
            className="btn btn-secondary cart-btn"
            aria-label={`Enquiry cart, ${cartCount} items`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M3 3h2l2.4 12.4A1.5 1.5 0 0 0 8.9 16.6H18a1.5 1.5 0 0 0 1.47-1.18L21.5 8H6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="9.5" cy="20" r="1.4" fill="currentColor" />
              <circle cx="17" cy="20" r="1.4" fill="currentColor" />
            </svg>
            {cartCount > 0 ? <span className="cart-badge">{cartCount}</span> : null}
          </Link>

          <span className="desktop-auth">
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
                  Staff login
                </Link>
              ))}
          </span>

          <button
            className="hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav className="mobile-menu container" aria-label="Mobile">
          <NavLink to="/" end className={navClass}>
            Home
          </NavLink>
          <NavLink to="/store" className={navClass}>
            Store{cartCount > 0 ? ` (${cartCount})` : ''}
          </NavLink>
          <NavLink to="/enquire" className={navClass}>
            Finder
          </NavLink>
          <NavLink to="/quote" className={navClass}>
            Get a quote
          </NavLink>
          {isAdmin ? (
            <NavLink to="/admin" className={navClass}>
              Dashboard
            </NavLink>
          ) : null}
          {!loading &&
            (user ? (
              <button className="btn btn-secondary" onClick={handleSignOut}>
                Sign out
              </button>
            ) : (
              <Link to="/login" className="btn btn-primary">
                Staff login
              </Link>
            ))}
        </nav>
      ) : null}

      <OfflineStrip />
    </header>
  );
}
