import { Link } from 'react-router-dom';
import { useCatalog } from '@/hooks/useCatalog';
import { useUI } from '@/stores/ui';
import { ProductCard } from '@/components/showroom/ProductCard';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? '263719450765';

const CATEGORIES = [
  {
    slug: 'generators',
    name: 'Generators',
    blurb: 'Diesel power from 10KVA to 300KVA',
    image: '/images/machinery/generators-flyer.jpg'
  },
  {
    slug: 'earthmoving',
    name: 'Excavators & Loaders',
    blurb: 'Excavators and loaders, new with zero hours',
    image: '/images/machinery/dezzi-excavator.jpg'
  },
  {
    slug: 'concrete-mixers',
    name: 'Concrete Mixers',
    blurb: 'Keep every pour on schedule',
    image: '/images/machinery/concrete-mixer.jpg'
  },
  {
    slug: 'power-tools',
    name: 'Power Tools',
    blurb: 'INGCO grinders, drills, cutters and pumps',
    image: '/images/machinery/angle-grinder-42v.jpg'
  }
];

const STEPS = [
  {
    title: 'Find your machine',
    text: 'Browse the store or answer two questions in the Finder.'
  },
  {
    title: 'Send two details',
    text: 'Name and phone number. Your order is saved with a reference.'
  },
  {
    title: 'Confirm on WhatsApp',
    text: 'One tap opens the chat with everything filled in, even on a social bundle.'
  }
];

const TRUST = [
  'Photographed in our yard. What you see is what is here.',
  'Priced in USD and ZiG, with VAT invoices for your books.',
  'Order over WhatsApp, even on a WhatsApp-only bundle.',
  'Every online order carries a reference number.'
];

export function LandingPage() {
  const { assets, loading } = useCatalog(undefined);
  const { bandwidthSaver } = useUI();
  const featured = assets.slice(0, 4);
  const reducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const showVideo = !bandwidthSaver && !reducedMotion;

  return (
    <div>
      {/* HERO: full bleed video */}
      <section
        style={{
          position: 'relative',
          width: '100vw',
          marginLeft: 'calc(50% - 50vw)',
          marginTop: -24,
          overflow: 'hidden',
          minHeight: '72vh',
          display: 'flex',
          alignItems: 'flex-end',
          background: '#0f172a'
        }}
      >
        {showVideo ? (
          <video
            src="/video/hero.mp4"
            poster="/images/hero.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <img
            src="/images/hero.jpg"
            alt="Wheel loader ready for work at the Abundance Solutions yard"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(10,10,10,0.85) 20%, rgba(10,10,10,0.15) 70%)'
          }}
        />
        <div className="container" style={{ position: 'relative', width: '100%' }}>
          <div
            style={{
              padding: '48px 0',
              color: '#fff',
              maxWidth: 600
            }}
          >
            <div
              style={{
                display: 'inline-block',
                background: 'var(--primary)',
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                padding: '4px 10px',
                borderRadius: 999,
                marginBottom: 10
              }}
            >
              ZIMBABWE · HEAVY MACHINERY & TOOLS
            </div>
            <h1 style={{ margin: '0 0 8px', fontSize: '2.4rem', lineHeight: 1.05 }}>
              Heavy machines. Honest prices.
            </h1>
            <p style={{ margin: '0 0 18px', opacity: 0.92, fontSize: '1.05rem' }}>
              Excavators, generators, mixers and INGCO tools, photographed in our own yard
              and priced in USD and ZiG. Light to browse, one tap to order on WhatsApp.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link
                to="/store"
                className="btn"
                style={{ background: 'var(--primary)', color: '#fff', padding: '14px 26px' }}
              >
                Browse equipment
              </Link>
              <a
                className="btn"
                style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', padding: '14px 26px' }}
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Abundance Solutions, I need equipment.')}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section style={{ marginTop: 28 }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
          {TRUST.map((t) => (
            <li
              key={t}
              style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '0.92rem' }}
            >
              <span style={{ color: 'var(--primary)', fontWeight: 800 }}>✓</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* CATEGORIES */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: '1.3rem', margin: '0 0 4px' }}>Shop the yard</h2>
        <p style={{ color: 'var(--text-muted)', margin: '0 0 14px' }}>
          Pick a lane. Real photos and real prices on everything.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 14
          }}
        >
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              to={`/store?category=${c.slug}`}
              style={{
                position: 'relative',
                borderRadius: 12,
                overflow: 'hidden',
                minHeight: 150,
                display: 'flex',
                alignItems: 'flex-end',
                color: '#fff'
              }}
            >
              <img
                src={c.image}
                alt={c.name}
                loading="lazy"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(10,10,10,0.8), rgba(10,10,10,0.05) 65%)'
                }}
              />
              <div style={{ position: 'relative', padding: 14 }}>
                <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{c.name}</div>
                <div style={{ fontSize: '0.82rem', opacity: 0.9 }}>{c.blurb}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: '1.3rem', margin: '0 0 14px' }}>How ordering works</h2>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
          {STEPS.map((s, i) => (
            <li key={s.title} style={{ display: 'flex', gap: 12 }}>
              <span
                style={{
                  flexShrink: 0,
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: '#fff',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {i + 1}
              </span>
              <div>
                <div style={{ fontWeight: 700 }}>{s.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{s.text}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* FEATURED */}
      <section style={{ marginTop: 32 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 14
          }}
        >
          <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Fresh on the yard</h2>
          <Link to="/store" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
            See the full store →
          </Link>
        </div>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading featured machines…</p>
        ) : (
          <div className="product-grid">
            {featured.map((a) => (
              <ProductCard key={a.id} asset={a} />
            ))}
          </div>
        )}
      </section>

      {/* FOOTER CTA */}
      <section
        className="card"
        style={{ marginTop: 32, padding: 24, textAlign: 'center', background: '#0f172a', color: '#fff', border: 'none' }}
      >
        <h2 style={{ margin: '0 0 6px' }}>Need iron on site this week?</h2>
        <p style={{ opacity: 0.85, margin: '0 0 16px' }}>
          Tell us the job. We confirm availability, price and delivery on WhatsApp.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/store" className="btn" style={{ background: 'var(--primary)', color: '#fff' }}>
            Browse equipment
          </Link>
          <a
            className="btn btn-secondary"
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Abundance Solutions, I need a quote.')}`}
            target="_blank"
            rel="noreferrer"
          >
            Get a quote
          </a>
        </div>
        <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: '16px 0 0' }}>
          Abundance Solutions · Zimbabwe · USD & ZiG accepted
        </p>
      </section>
    </div>
  );
}
