// Public exchange-rate lookup via the checkout Edge Function.
// Rates change daily: cached for 6h to save data, stale cache reused offline.

export const PUBLIC_ORG_ID = '00000000-0000-0000-0000-000000000001';

export interface RateResult {
  rate: number | null;
  effectiveAt: string | null;
  stale: boolean;
}

const CACHE_KEY = 'abundance-rate';
const TTL_MS = 6 * 60 * 60 * 1000;

interface CacheEntry {
  rate: number | null;
  effectiveAt: string | null;
  fetchedAt: number;
}

function readCache(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CacheEntry>;
    if (typeof parsed.fetchedAt !== 'number') return null;
    return {
      rate: typeof parsed.rate === 'number' ? parsed.rate : null,
      effectiveAt: typeof parsed.effectiveAt === 'string' ? parsed.effectiveAt : null,
      fetchedAt: parsed.fetchedAt
    };
  } catch {
    return null;
  }
}

function writeCache(entry: CacheEntry): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Storage full or unavailable - rate still returned for this session.
  }
}

export async function getLiveRate(): Promise<RateResult> {
  const cached = readCache();
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
    return { rate: cached.rate, effectiveAt: cached.effectiveAt, stale: false };
  }

  try {
    const base = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const res = await fetch(
      `${base}/functions/v1/checkout?organization_id=${PUBLIC_ORG_ID}`,
      {
        headers: { apikey: key },
        signal: AbortSignal.timeout(10000)
      }
    );
    if (!res.ok) throw new Error(`Rate lookup failed: ${res.status}`);
    const data = (await res.json()) as { rate?: unknown; effectiveAt?: unknown };
    const result: RateResult = {
      rate: typeof data.rate === 'number' ? data.rate : null,
      effectiveAt: typeof data.effectiveAt === 'string' ? data.effectiveAt : null,
      stale: false
    };
    writeCache({ ...result, fetchedAt: Date.now() });
    return result;
  } catch {
    if (cached) {
      return { rate: cached.rate, effectiveAt: cached.effectiveAt, stale: true };
    }
    return { rate: null, effectiveAt: null, stale: false };
  }
}
