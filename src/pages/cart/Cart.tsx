import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingCart, Sigma } from 'lucide-react';
import { accessoryImageUrl, cartAPI } from '@/core/api/vnwAPI';
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

  const remove = async (it: any) => { it.item_type === 'ACCESSORY' ? await cartAPI.removeAccessory(it.accessory_id) : await cartAPI.remove(it.number_id); await refreshCounts(); load(); };
  const updateQty = async (it: any, quantity: number) => { await cartAPI.updateAccessory(it.accessory_id, quantity); await refreshCounts(); load(); };

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
              <div key={`${it.item_type}-${it.item_id}`} className="vnw-card flex flex-wrap items-center justify-between gap-4 p-4">
                <div>
                  {it.item_type === 'ACCESSORY' ? <div className="flex items-center gap-3">{it.primary_image_id&&<img src={accessoryImageUrl(it.primary_image_id)} alt="" className="h-16 w-16 rounded-xl object-contain"/>}<div><Link to={`/accessories/${it.slug}`} className="text-base font-extrabold text-foreground">{it.name}</Link><div className="text-xs text-muted-foreground">{it.brand} · {it.sku}</div></div></div> : <Link to={`/number/${it.number_id}`} className="text-xl font-extrabold text-foreground">{it.display_number}</Link>}
                  {it.item_type !== 'ACCESSORY' &&
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{it.title_label || getPrimaryCategory(it)?.name || 'VIP Number'}</span>
                    <span className="flex items-center gap-1"><Sigma className="h-3 w-3" /> Sum {it.numerology_sum}</span>
                  </div>}
                </div>
                <div className="flex items-center gap-4">
                  {it.item_type === 'ACCESSORY'&&<div className="flex items-center rounded-xl border border-border"><button aria-label="Decrease quantity" className="grid h-11 w-11 place-items-center" onClick={()=>updateQty(it,it.quantity-1)}><Minus className="h-4 w-4"/></button><span className="min-w-8 text-center font-black">{it.quantity}</span><button aria-label="Increase quantity" className="grid h-11 w-11 place-items-center" disabled={it.quantity>=it.available_stock} onClick={()=>updateQty(it,it.quantity+1)}><Plus className="h-4 w-4"/></button></div>}
                  <span className="font-bold text-foreground">{formatINR(it.line_total ?? it.offer_price)}</span>
                  <button aria-label="Remove item" onClick={() => remove(it)} className="grid h-11 w-11 place-items-center text-muted-foreground hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
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
