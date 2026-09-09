import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCatalog } from '@/hooks/useCatalog';
import { CategoryFilter } from '@/components/showroom/CategoryFilter';
import { ProductGrid } from '@/components/showroom/ProductGrid';
import { CartDrawer } from '@/components/showroom/CartDrawer';
import { CartBar, CartBarSpacer, Skeletons } from '@/components/store/CartBar';
import { ErrorState } from '@/components/ui/States';
import { Input } from '@/components/ui/Field';

type Sort = 'newest' | 'price-asc' | 'price-desc';

export function StorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get('category') ?? undefined;
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const [cartOpen, setCartOpen] = useState(false);

  const { categories, assets, loading, error } = useCatalog(categorySlug);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? assets.filter(
          (a) =>
            (a.name ?? '').toLowerCase().includes(q) ||
            (a.description ?? '').toLowerCase().includes(q)
        )
      : [...assets];

    switch (sort) {
      case 'price-asc':
        filtered.sort((a, b) => (a.price_usd ?? Infinity) - (b.price_usd ?? Infinity));
        break;
      case 'price-desc':
        filtered.sort((a, b) => (b.price_usd ?? -1) - (a.price_usd ?? -1));
        break;
      default:
        break;
    }
    return filtered;
  }, [assets, query, sort]);

  const selectCategory = (slug: string | undefined) => {
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div>
      <section style={{ padding: '8px 0' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Equipment store</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
          Real stock, real prices. Enquire over WhatsApp.{' '}
          <Link to="/enquire">Not sure what you need? Find your machine →</Link>
        </p>
      </section>

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 4,
          position: 'sticky',
          top: 60,
          background: 'var(--bg)',
          padding: '8px 0',
          zIndex: 30
        }}
      >
        <Input
          type="search"
          placeholder="Search machines…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search equipment"
          style={{ flex: 1 }}
        />
        <select
          className="select"
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          aria-label="Sort equipment"
          style={{ width: 'auto' }}
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price ↑</option>
          <option value="price-desc">Price ↓</option>
        </select>
      </div>

      <CategoryFilter
        categories={categories}
        activeSlug={categorySlug}
        onSelect={selectCategory}
      />

      {loading ? (
        <Skeletons />
      ) : error ? (
        <ErrorState message={error} />
      ) : query && visible.length === 0 ? (
        <div className="empty-state">
          <h3>No matches for “{query}”</h3>
          <p>Try a different term, or WhatsApp us — we source on request.</p>
        </div>
      ) : (
        <ProductGrid assets={visible} />
      )}

      <CartBarSpacer />
      <CartBar onReview={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
