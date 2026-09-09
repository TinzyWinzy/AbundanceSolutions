import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCatalog } from '@/hooks/useCatalog';
import {
  BUDGETS,
  JOBS,
  openFinderWhatsApp,
  recommend,
  type Budget,
  type Job
} from '@/lib/inquiry/matcher';
import { Button } from '@/components/ui/Button';
import { ProductCard } from '@/components/showroom/ProductCard';
import { ErrorState, Spinner } from '@/components/ui/States';

type Step = 'job' | 'budget' | 'results';

export function EnquirePage() {
  const [step, setStep] = useState<Step>('job');
  const [job, setJob] = useState<Job | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const { categories, assets, loading, error } = useCatalog(undefined);

  const result = useMemo(() => {
    if (!job || !budget) return null;
    return recommend(assets, categories, job, budget);
  }, [assets, categories, job, budget]);

  const jobTitle = JOBS.find((j) => j.value === job)?.title ?? '';
  const budgetTitle = BUDGETS.find((b) => b.value === budget)?.title ?? '';

  const sendShortlist = () => {
    if (!result) return;
    openFinderWhatsApp({
      jobTitle,
      budgetTitle,
      picks: result.primary.map((a) => ({
        name: a.name ?? 'Unnamed item',
        quantity: 1,
        unitPriceUsd: a.price_usd
      }))
    });
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Find your machine</h1>
      <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>
        Two questions. We match live stock — nothing invented.
      </p>

      <ol
        style={{ listStyle: 'none', display: 'flex', gap: 6, padding: 0, margin: '0 0 20px' }}
        aria-label="Finder progress"
      >
        {(['job', 'budget', 'results'] as Step[]).map((s, i) => (
          <li
            key={s}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '8px 4px',
              borderRadius: 8,
              background:
                s === step ? 'var(--primary-soft)' : 'var(--surface-2)',
              color: s === step ? 'var(--text)' : 'var(--text-muted)'
            }}
            aria-current={s === step ? 'step' : undefined}
          >
            {i + 1}. {s === 'job' ? 'Job' : s === 'budget' ? 'Budget' : 'Matches'}
          </li>
        ))}
      </ol>

      {step === 'job' && (
        <div style={{ display: 'grid', gap: 10 }}>
          {JOBS.map((j) => (
            <button
              key={j.value}
              className="card"
              style={{
                padding: 16,
                textAlign: 'left',
                cursor: 'pointer',
                borderColor: job === j.value ? 'var(--primary)' : undefined,
                borderWidth: job === j.value ? 2 : 1
              }}
              onClick={() => {
                setJob(j.value);
                setStep('budget');
              }}
            >
              <div style={{ fontWeight: 800 }}>{j.title}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{j.hint}</div>
            </button>
          ))}
        </div>
      )}

      {step === 'budget' && (
        <div>
          <div style={{ display: 'grid', gap: 10 }}>
            {BUDGETS.map((b) => (
              <button
                key={b.value}
                className="card"
                style={{ padding: 16, textAlign: 'left', cursor: 'pointer' }}
                onClick={() => {
                  setBudget(b.value);
                  setStep('results');
                }}
              >
                <div style={{ fontWeight: 800 }}>{b.title}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{b.hint}</div>
              </button>
            ))}
          </div>
          <p style={{ marginTop: 12 }}>
            <button className="btn btn-ghost" onClick={() => setStep('job')}>
              ← Back
            </button>
          </p>
        </div>
      )}

      {step === 'results' && (
        <div>
          {loading ? (
            <Spinner />
          ) : error ? (
            <ErrorState message={error} />
          ) : result && result.primary.length + result.also.length > 0 ? (
            <>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {jobTitle} · {budgetTitle}
                {result.categoryNames.length > 0
                  ? ` · ${result.categoryNames.join(', ')}`
                  : ''}
              </p>
              <h2 style={{ fontSize: '1.1rem' }}>
                Best matches ({result.primary.length})
              </h2>
              <div className="product-grid" style={{ marginBottom: 20 }}>
                {result.primary.map((a) => (
                  <ProductCard key={a.id} asset={a} />
                ))}
              </div>
              {result.also.length > 0 && (
                <>
                  <h2 style={{ fontSize: '1.1rem' }}>Also in this range</h2>
                  <div className="product-grid" style={{ marginBottom: 20 }}>
                    {result.also.map((a) => (
                      <ProductCard key={a.id} asset={a} />
                    ))}
                  </div>
                </>
              )}
              <div className="card no-print" style={{ padding: 16, marginTop: 8 }}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>Like the shortlist?</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Button onClick={sendShortlist}>Send shortlist on WhatsApp</Button>
                  <Link to="/quote" className="btn btn-secondary">
                    Build a quotation
                  </Link>
                  <Link to="/store" className="btn btn-ghost">
                    Browse all
                  </Link>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 0 }}>
                  Tip: tap “Add to enquiry” on machines first, then build the quotation.
                </p>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h3>No matches in live stock</h3>
              <p>We source on request — send us the job on WhatsApp.</p>
              <Button
                onClick={() =>
                  openFinderWhatsApp({ jobTitle, budgetTitle, picks: [] })
                }
              >
                Ask on WhatsApp
              </Button>
            </div>
          )}
          <p style={{ marginTop: 12 }}>
            <button className="btn btn-ghost" onClick={() => setStep('budget')}>
              ← Back
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
