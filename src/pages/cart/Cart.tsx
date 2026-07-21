import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingCart, Sigma } from 'lucide-react';
import { cartAPI } from '@/core/api/vnwAPI';
import { useStore } from '@/shared/store/useStore';
import { localService } from '@/core/services/local';
import { formatINR } from '@/core/lib/format';
import { getPrimaryCategory } from '@/core/categories/types';
import { Loader, EmptyState } from '@/shared/components/ui-bits';

export default function Cart() {
  const navigate = useNavigate();
  const { refreshCounts } = useStore();
  const [data, setData] = useState<any>({ items: [], subtotal: 0 });
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!localService.getToken()) { navigate('/login'); return; }
    setLoading(true);
    cartAPI.list().then(setData).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const remove = async (id: number) => { await cartAPI.remove(id); await refreshCounts(); load(); };

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-10"><Loader /></div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-extrabold text-foreground">Your Cart</h1>
      {data.items.length === 0 ? (
        <EmptyState title="Your cart is empty" subtitle="Browse our premium VIP numbers and add your favourites."
          action={<Link to="/shop" className="btn-gold">Explore Numbers</Link>} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {data.items.map((it: any) => (
              <div key={it.cart_item_id} className="vnw-card flex items-center justify-between p-4">
                <div>
                  <Link to={`/number/${it.number_id}`} className="text-xl font-extrabold text-foreground">{it.display_number}</Link>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{it.title_label || getPrimaryCategory(it)?.name || 'VIP Number'}</span>
                    <span className="flex items-center gap-1"><Sigma className="h-3 w-3" /> Sum {it.numerology_sum}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-foreground">{formatINR(it.offer_price)}</span>
                  <button onClick={() => remove(it.number_id)} className="text-muted-foreground hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="vnw-card h-fit p-5">
            <h3 className="mb-4 font-semibold text-foreground">Order Summary</h3>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Items</span><span>{data.items.length}</span></div>
            <div className="mt-2 flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-bold text-foreground">{formatINR(data.subtotal)}</span></div>
            <button onClick={() => navigate('/checkout')} className="btn-gold mt-5 w-full"><ShoppingCart className="h-4 w-4" /> Proceed to Checkout</button>
            <Link to="/shop" className="btn-gold-outline mt-3 block w-full text-center">Continue Shopping</Link>
          </div>
        </div>
      )}
    </div>
  );
}
