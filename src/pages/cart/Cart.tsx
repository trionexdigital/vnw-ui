import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingCart, Sigma, ShieldCheck } from 'lucide-react';
import CompactPageHeader from '@/shared/components/CompactPageHeader';
import { useToast } from '@/shared/hooks/use-toast';
import { cartAPI } from '@/core/api/vnwAPI';
import { useStore } from '@/shared/store/useStore';
import { localService } from '@/core/services/local';
import { formatINR } from '@/core/lib/format';
import { getPrimaryCategory } from '@/core/categories/types';
import { Loader, EmptyState } from '@/shared/components/ui-bits';

export default function Cart() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [removing, setRemoving] = useState<number | null>(null);
  const { refreshCounts } = useStore();
  const [data, setData] = useState<any>({ items: [], subtotal: 0 });
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!localService.getToken()) { navigate('/login'); return; }
    setLoading(true);
    cartAPI.list().then(setData).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const remove = async (it: any) => { setRemoving(it.number_id); try { await cartAPI.remove(it.number_id); await refreshCounts(); load(); } catch (e: any) { toast({ title: 'Could not remove number', description: e.message, variant: 'destructive' }); } finally { setRemoving(null); } };

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-10"><Loader /></div>;

  return (
    <div className="commerce-page">
      <CompactPageHeader title="Your cart" subtitle={`${data.items.length} numbers selected. Your next memorable identity starts here.`} icon={ShoppingCart} action={<Link to="/shop" className="btn-gold-outline min-h-9 text-xs">Explore numbers</Link>} />
      {data.items.length === 0 ? (
        <EmptyState title="Your cart is empty" subtitle="Browse our premium VIP numbers and add your favourites."
          action={<Link to="/shop" className="btn-gold">Explore Numbers</Link>} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {data.items.map((it: any) => (
              <div key={it.number_id} className="commerce-panel flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link to={`/number/${it.number_id}`} className="text-lg font-black text-foreground">{it.display_number}</Link>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{it.title_label || getPrimaryCategory(it)?.name || 'VIP Number'}</span>
                    <span className="flex items-center gap-1"><Sigma className="h-3 w-3" /> Sum {it.numerology_sum}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right"><strong className="text-sm text-primary">{formatINR(it.line_total ?? it.offer_price)}</strong><del className="block text-[11px] text-muted-foreground">{formatINR(it.mrp)}</del></div>
                  <button disabled={removing === it.number_id} aria-label={`Remove ${it.display_number}`} onClick={() => remove(it)} className="grid h-11 w-11 place-items-center text-muted-foreground hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="commerce-panel h-fit lg:sticky lg:top-24">
            <h3 className="mb-4 font-semibold text-foreground">Order Summary</h3>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Items</span><span>{data.items.length}</span></div>
            <div className="mt-2 flex justify-between text-xs"><span className="text-muted-foreground">MRP total</span><span>{formatINR(data.items.reduce((sum: number, n: any) => sum + Number(n.mrp), 0))}</span></div><div className="mt-2 flex justify-between text-xs text-success"><span>Offer savings</span><span>{formatINR(data.items.reduce((sum: number, n: any) => sum + Number(n.mrp), 0) - Number(data.subtotal))}</span></div><div className="mt-3 flex justify-between border-t border-border pt-3"><span className="text-muted-foreground">Subtotal</span><span className="font-bold text-foreground">{formatINR(data.subtotal)}</span></div>
            <p className="mt-2 text-[11px] text-muted-foreground">Coupons and GST are calculated at checkout.</p><button onClick={() => navigate('/checkout')} className="btn-gold mt-5 w-full"><ShoppingCart className="h-4 w-4" /> Proceed to Checkout</button>
            <Link to="/shop" className="btn-gold-outline mt-3 block w-full text-center">Continue Shopping</Link>
          </div>
        </div>
      )}
    </div>
  );
}
