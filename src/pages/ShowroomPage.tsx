import { useState } from 'react';
import { useCatalog } from '@/hooks/useCatalog';
import { useCart } from '@/stores/cart';
import { CategoryFilter } from '@/components/showroom/CategoryFilter';
import { ProductGrid } from '@/components/showroom/ProductGrid';
import { CartDrawer } from '@/components/showroom/CartDrawer';
import { ErrorState, Spinner } from '@/components/ui/States';

export function ShowroomPage() {
  const [categorySlug, setCategorySlug] = useState<string | undefined>(undefined);
  const [cartOpen, setCartOpen] = useState(false);
  const { categories, assets, loading, error } = useCatalog(categorySlug);
  const cartCount = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));

  return (
    <div>
      <section style={{ padding: '24px 0 8px' }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem' }}>Industrial equipment</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
          Generators, excavators, concrete mixers and more — browsable offline.
        </p>
      </section>

      <CategoryFilter
        categories={categories}
        activeSlug={categorySlug}
        onSelect={setCategorySlug}
      />

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <ProductGrid assets={assets} />
      )}

      {/* Floating cart button */}
      <button
        className="btn btn-primary"
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          borderRadius: 999,
          padding: '14px 20px',
          boxShadow: '0 4px 16px rgba(15, 118, 110, 0.4)',
          zIndex: 50
        }}
        onClick={() => setCartOpen(true)}
      >
        Enquiry{'\u00A0'}({cartCount})
      </button>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
