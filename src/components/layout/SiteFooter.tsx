import { Link } from 'react-router-dom';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? '263719450765';

const SHOP_LINKS = [
  { slug: 'generators', name: 'Generators' },
  { slug: 'earthmoving', name: 'Excavators & Loaders' },
  { slug: 'concrete-mixers', name: 'Concrete Mixers' },
  { slug: 'power-tools', name: 'Power Tools' }
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        background: '#0f172a',
        color: '#e2e8f0',
        marginTop: 48
      }}
    >
      <div
        className="container"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 28,
          paddingTop: 36,
          paddingBottom: 28
        }}
      >
        <div>
          <img
            src="/logo.jpg"
            alt="Abundance Solutions"
            style={{ height: 44, borderRadius: 8, marginBottom: 10 }}
          />
          <p style={{ fontSize: '0.86rem', opacity: 0.8, margin: 0, maxWidth: 280 }}>
            Site-ready machinery and tools in Zimbabwe. Real stock, USD & ZiG prices, ordering
            over WhatsApp.
          </p>
        </div>

        <nav aria-label="Shop">
          <div style={{ fontWeight: 800, marginBottom: 10, fontSize: '0.85rem' }}>SHOP</div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
            {SHOP_LINKS.map((c) => (
              <li key={c.slug}>
                <Link
                  to={`/store?category=${c.slug}`}
                  style={{ color: '#e2e8f0', fontSize: '0.88rem' }}
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Company">
          <div style={{ fontWeight: 800, marginBottom: 10, fontSize: '0.85rem' }}>COMPANY</div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
            <li>
              <Link to="/" style={{ color: '#e2e8f0', fontSize: '0.88rem' }}>
                Home
              </Link>
            </li>
            <li>
              <Link to="/store" style={{ color: '#e2e8f0', fontSize: '0.88rem' }}>
                Store
              </Link>
            </li>
            <li>
              <Link to="/login" style={{ color: '#e2e8f0', fontSize: '0.88rem' }}>
                Staff login
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <div style={{ fontWeight: 800, marginBottom: 10, fontSize: '0.85rem' }}>CONTACT</div>
          <p style={{ fontSize: '0.88rem', opacity: 0.8, margin: '0 0 10px' }}>Zimbabwe</p>
          <a
            className="btn"
            style={{ background: 'var(--primary)', color: '#fff' }}
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Abundance Solutions.')}`}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp us
          </a>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(226,232,240,0.15)' }}>
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 8,
            flexWrap: 'wrap',
            paddingTop: 14,
            paddingBottom: 14,
            fontSize: '0.78rem',
            opacity: 0.7
          }}
        >
          <span>© {year} Abundance Solutions. All rights reserved.</span>
          <span>USD & ZiG accepted · Prices include VAT where stated</span>
        </div>
      </div>
    </footer>
  );
}
