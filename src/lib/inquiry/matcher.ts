import type { Category, InventoryAsset } from '@/lib/powersync/AppSchema';

export type Job =
  | 'earthmoving'
  | 'loading'
  | 'power'
  | 'concrete'
  | 'metalwork'
  | 'pumping';

export interface JobOption {
  value: Job;
  title: string;
  hint: string;
}

export const JOBS: JobOption[] = [
  { value: 'earthmoving', title: 'Digging & earthmoving', hint: 'Excavators, TLBs' },
  { value: 'loading', title: 'Loading & hauling', hint: 'Wheel loaders, backhoes' },
  { value: 'power', title: 'Site power', hint: 'Diesel & petrol generators' },
  { value: 'concrete', title: 'Concrete work', hint: 'Mixers' },
  { value: 'metalwork', title: 'Grinding & cutting', hint: 'Grinders, drills, cutters' },
  { value: 'pumping', title: 'Water pumping', hint: 'Petrol water pumps' }
];

const JOB_TO_CATEGORIES: Record<Job, string[]> = {
  earthmoving: ['earthmoving'],
  loading: ['earthmoving'],
  power: ['generators'],
  concrete: ['concrete-mixers'],
  metalwork: ['power-tools'],
  pumping: ['power-tools']
};

export type Budget = 'under500' | 'mid' | 'over5k' | 'any';

export const BUDGETS: { value: Budget; title: string; hint: string }[] = [
  { value: 'under500', title: 'Under $500', hint: 'Tools & attachments' },
  { value: 'mid', title: '$500 - $5,000', hint: 'Small plant & pumps' },
  { value: 'over5k', title: 'Over $5,000', hint: 'Heavy machines' },
  { value: 'any', title: 'Just show me everything', hint: 'Full range' }
];

function budgetCap(budget: Budget): number | null {
  switch (budget) {
    case 'under500':
      return 500;
    case 'mid':
      return 5000;
    case 'over5k':
      return null;
    case 'any':
      return null;
  }
}

export interface Recommendation {
  primary: InventoryAsset[];
  also: InventoryAsset[];
  categoryNames: string[];
}

/**
 * Rule-based matching on live catalog data. No invented inventory:
 * primary = in-category + within budget (or price-on-enquiry);
 * also = rest of the category. Over-5k means price above 5k or unpriced
 * heavy plant shown with an enquiry flag.
 */
export function recommend(
  assets: InventoryAsset[],
  categories: Category[],
  job: Job,
  budget: Budget
): Recommendation {
  const slugs = JOB_TO_CATEGORIES[job];
  const catIds = new Set(
    categories.filter((c) => c.slug && slugs.includes(c.slug)).map((c) => c.id)
  );
  const inCategory = assets.filter((a) => a.category_id && catIds.has(a.category_id));
  const cap = budgetCap(budget);

  const categoryNames = categories
    .filter((c) => c.slug && slugs.includes(c.slug))
    .map((c) => c.name ?? '')
    .filter(Boolean);

  if (budget === 'any') {
    return { primary: inCategory, also: [], categoryNames };
  }

  const primary: InventoryAsset[] = [];
  const also: InventoryAsset[] = [];

  for (const asset of inCategory) {
    const price = asset.price_usd;
    if (price == null) {
      // Price on enquiry: always surfaced, ranked after priced matches.
      (budget === 'over5k' ? primary : also).push(asset);
    } else if (budget === 'over5k') {
      (price > 5000 ? primary : also).push(asset);
    } else if (cap != null && price <= cap) {
      primary.push(asset);
    } else {
      also.push(asset);
    }
  }

  primary.sort((a, b) => (a.price_usd ?? Infinity) - (b.price_usd ?? Infinity));
  return { primary, also, categoryNames };
}

export interface FinderSummary {
  jobTitle: string;
  budgetTitle: string;
  picks: { name: string; quantity: number; unitPriceUsd: number | null }[];
}

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? '263719450765';

export function buildFinderWhatsAppUrl(summary: FinderSummary): string {
  const lines = summary.picks
    .map(
      (p) =>
        `- ${p.name} x${p.quantity}` +
        (p.unitPriceUsd != null ? ` @ $${p.unitPriceUsd.toFixed(2)}` : ' (price on enquiry)')
    )
    .join('\n');

  const text =
    `Equipment enquiry\nJob: ${summary.jobTitle}\nBudget: ${summary.budgetTitle}\n` +
    (lines ? `${lines}\n` : 'Shortlist:\n') +
    `Please advise availability and delivery.`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function openFinderWhatsApp(summary: FinderSummary): void {
  window.open(buildFinderWhatsAppUrl(summary), '_blank', 'noopener,noreferrer');
}
