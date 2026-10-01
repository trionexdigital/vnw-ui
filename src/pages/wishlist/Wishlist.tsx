import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import CompactPageHeader from '@/shared/components/CompactPageHeader';
import { wishlistAPI } from '@/core/api/vnwAPI';
import { useStore } from '@/shared/store/useStore';
import NumberCard from '@/shared/components/NumberCard';
import { Loader, EmptyState } from '@/shared/components/ui-bits';

export default function Wishlist() {
  const { refreshCounts } = useStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); wishlistAPI.list().then((d) => setItems(d.items || [])).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); refreshCounts(); /* eslint-disable-next-line */ }, []);

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-10"><Loader /></div>;

  return (
    <div className="commerce-page">
      <CompactPageHeader title="Your wishlist" subtitle={`${items.length} favourites saved. Compare them or find the one that feels right.`} icon={Heart} action={<Link to="/shop" className="btn-gold-outline min-h-9 text-xs">Explore numbers</Link>} />
      {items.length === 0 ? (
        <EmptyState title="Your wishlist is empty" subtitle="Tap the heart on any number to save it here."
          action={<Link to="/shop" className="btn-gold">Explore Numbers</Link>} />
      ) : (
        <div className="number-card-grid">
          {items.map((n) => <NumberCard key={n.number_id} item={n} onWishlistChange={() => { load(); refreshCounts(); }} />)}
        </div>
      )}
    </div>
  );
}
