import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { privateCollectionsAPI, type NumberCatalogItem, type PrivateCollection as PrivateCollectionModel } from '@/core/api/vnwAPI';
import NumberCard from '@/shared/components/NumberCard';
import { EmptyState, Loader } from '@/shared/components/ui-bits';

export default function PrivateCollection() {
  const { token = '' } = useParams();
  const [collection, setCollection] = useState<PrivateCollectionModel | null>(null);
  const [items, setItems] = useState<NumberCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    privateCollectionsAPI.resolve(token, { page, limit: 24, q: search })
      .then((data) => {
        if (cancelled) return;
        sessionStorage.setItem('vnw_private_token', token);
        setCollection(data.collection); setItems(data.items || []); setTotal(data.total || 0);
      })
      .catch((requestError: any) => {
        if (!cancelled) { sessionStorage.removeItem('vnw_private_token'); setError(requestError?.message || 'This private collection is unavailable.'); }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, page, search]);

  if (loading) return <Loader label="Opening private VIP collection" variant="shop" />;
  if (error) return <div className="mx-auto max-w-4xl py-12"><EmptyState title="Private collection unavailable" subtitle={error} /></div>;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="sr-only">{collection?.name}</h1>
      <form className="mb-4 flex max-w-lg gap-2" onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(query.trim()); }}><input aria-label="Search offline catalog" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a number" className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-card px-3" /><button className="rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">Search</button></form>
      {items.length ? (
        <div className="number-card-grid">
          {items.map((item) => <NumberCard key={item.number_id} item={item} />)}
        </div>
      ) : <EmptyState title="No available numbers" subtitle="This collection currently has no numbers available for purchase." />}
      {total > 24 && <div className="mt-5 flex items-center justify-end gap-3 text-sm"><span>{(page - 1) * 24 + 1}–{Math.min(page * 24, total)} of {total}</span><button disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-border px-3 py-2 disabled:opacity-50">Previous</button><button disabled={page * 24 >= total} onClick={() => setPage(page + 1)} className="rounded-lg border border-border px-3 py-2 disabled:opacity-50">Next</button></div>}
    </div>
  );
}
