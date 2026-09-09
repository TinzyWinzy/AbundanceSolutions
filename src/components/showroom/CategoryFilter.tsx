import type { Category } from '@/lib/powersync/AppSchema';

interface CategoryFilterProps {
  categories: Category[];
  activeSlug: string | undefined;
  onSelect: (slug: string | undefined) => void;
}

export function CategoryFilter({ categories, activeSlug, onSelect }: CategoryFilterProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        padding: '8px 0',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <button
        className={`btn ${activeSlug === undefined ? 'btn-primary' : 'btn-secondary'}`}
        style={{ fontSize: '0.82rem', padding: '8px 14px' }}
        onClick={() => onSelect(undefined)}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          className={`btn ${activeSlug === category.slug ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.82rem', padding: '8px 14px' }}
          onClick={() => onSelect(category.slug ?? undefined)}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
