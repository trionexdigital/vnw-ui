import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { privateCollectionsAPI, type NumberCatalogItem, type PrivateCollection as PrivateCollectionModel } from '@/core/api/vnwAPI';
import NumberCard from '@/shared/components/NumberCard';
import { EmptyState, Loader } from '@/shared/components/ui-bits';

export default function PrivateCollection() {
  const { token = '' } = useParams();
  const [collection, setCollection] = useState<PrivateCollectionModel | null>(null);
  const [items, setItems] = useState<NumberCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    privateCollectionsAPI.resolve(token)
      .then((data) => {
        if (cancelled) return;
        sessionStorage.setItem('vnw_private_token', token);
        setCollection(data.collection); setItems(data.items || []);
      })
      .catch((requestError: any) => {
        if (!cancelled) { sessionStorage.removeItem('vnw_private_token'); setError(requestError?.message || 'This private collection is unavailable.'); }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  if (loading) return <Loader label="Opening private VIP collection" variant="shop" />;
  if (error) return <div className="mx-auto max-w-4xl py-12"><EmptyState title="Private collection unavailable" subtitle={error} /></div>;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <section className="vip-page-header mb-6 flex flex-wrap items-center justify-between gap-4 p-5 sm:p-7">
        <div className="relative z-10">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-accent">
            <KeyRound className="h-3.5 w-3.5" /> Private access
          </div>
          <h1 className="text-2xl font-black text-foreground sm:text-4xl">{collection?.name}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">A private selection of VIP numbers shared with you by VIP NUMBER WORLD.</p>
        </div>
        <div className="relative z-10 flex items-center gap-2 rounded-2xl border border-success/25 bg-success-soft px-4 py-3 text-sm font-bold text-success">
          <ShieldCheck className="h-5 w-5" /> Secure collection
        </div>
      </section>
      {items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => <NumberCard key={item.number_id} item={item} />)}
        </div>
      ) : <EmptyState title="No available numbers" subtitle="This collection currently has no numbers available for purchase." />}
    </div>
  );
}
