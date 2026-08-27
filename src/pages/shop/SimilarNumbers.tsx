import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, GitCompareArrows, RefreshCw, Sparkles } from 'lucide-react';
import { numbersAPI, type SimilarNumbersResponse } from '@/core/api/vnwAPI';
import NumberCard from '@/shared/components/NumberCard';
import { EmptyState, Loader } from '@/shared/components/ui-bits';
import { getPrimaryCategory } from '@/core/categories/types';
import { MotionGrid, MotionGridItem, MotionReveal } from '@/shared/motion/MotionPrimitives';

export default function SimilarNumbers() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const [data, setData] = useState<SimilarNumbersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const numberId = Number(id);
    let cancelled = false;
    setLoading(true);
    setError('');
    numbersAPI.similar({ number_id: numberId, page, limit: 12 })
      .then((response) => { if (!cancelled) setData(response); })
      .catch((requestError: any) => {
        if (cancelled) return;
        setData(null);
        setError(requestError?.message || 'We could not find similar numbers right now.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    if (import.meta.env.MODE !== 'test') window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => { cancelled = true; };
  }, [id, page, retry]);

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    if (nextPage <= 1) next.delete('page');
    else next.set('page', String(nextPage));
    setSearchParams(next);
  };

  if (loading) return <div className="mx-auto min-h-[50vh] max-w-7xl px-4 py-16"><Loader /></div>;

  if (error || !data) {
    const sourceMissing = /not found/i.test(error);
    return (
      <div className="mx-auto min-h-[55vh] max-w-4xl px-4 py-16">
        <EmptyState
          title={sourceMissing ? 'Number not found' : 'Similar numbers could not be loaded'}
          subtitle={sourceMissing ? 'This VIP number is no longer in the catalogue.' : error}
          action={sourceMissing
            ? <Link to="/shop" className="btn-gold">Browse VIP numbers</Link>
            : <button className="btn-gold" onClick={() => setRetry((value) => value + 1)}><RefreshCw className="h-4 w-4" />Try again</button>}
        />
      </div>
    );
  }

  const category = getPrimaryCategory(data.source);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
      <MotionReveal>
        <Link to={`/number/${data.source.number_id}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-black text-muted-foreground transition hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <ArrowLeft className="h-4 w-4" /> Back to number details
        </Link>
      </MotionReveal>

      <MotionReveal delay={0.04} className="similar-numbers-hero mt-1 overflow-hidden rounded-[1.5rem] border p-4 sm:p-5">
        <div className="relative z-10 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-primary"><GitCompareArrows className="h-4 w-4" /> Pattern discovery</div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl">Numbers similar to <span className="similar-numbers-hero__number vnw-card-numeral">{data.source.display_number}</span></h1>
            <p className="mt-2 max-w-3xl text-xs leading-5 text-muted-foreground sm:text-sm">Matches blend the automatic category, visible starting and ending sequences, digit positions and frequency, numerology, and price proximity.</p>
          </div>
          <div className="similar-numbers-hero__summary rounded-xl border px-4 py-3">
            <div className="text-[10px] font-black uppercase tracking-[.16em] text-muted-foreground">Source pattern</div>
            <div className="mt-1 flex items-center gap-2 font-black text-foreground"><Sparkles className="h-4 w-4 text-primary" />{category?.name || 'Unique Number'}</div>
            <div className="mt-2 text-sm font-bold text-primary">{data.total} close {data.total === 1 ? 'match' : 'matches'}</div>
          </div>
        </div>
      </MotionReveal>

      {data.items.length ? (
        <MotionGrid className="number-card-grid mt-4">
          {data.items.map((number) => <MotionGridItem key={number.number_id}><NumberCard item={number} /></MotionGridItem>)}
        </MotionGrid>
      ) : (
        <div className="mt-8"><EmptyState title="No similar numbers available" subtitle="This number is truly distinctive. Browse the full collection to discover another pattern." action={<Link to="/shop" className="btn-gold">Browse all numbers</Link>} /></div>
      )}

      {data.pages > 1 && (
        <nav aria-label="Similar numbers pagination" className="mt-5 flex items-center justify-center gap-3">
          <button aria-label="Previous page" className="btn-gold-outline min-h-11 px-4" disabled={page <= 1} onClick={() => goToPage(page - 1)}><ChevronLeft className="h-4 w-4" />Previous</button>
          <span className="grid min-h-11 place-items-center rounded-xl border border-border bg-card px-4 text-sm font-black text-foreground">Page {page} of {data.pages}</span>
          <button aria-label="Next page" className="btn-gold-outline min-h-11 px-4" disabled={page >= data.pages} onClick={() => goToPage(page + 1)}>Next<ChevronRight className="h-4 w-4" /></button>
        </nav>
      )}
    </div>
  );
}
