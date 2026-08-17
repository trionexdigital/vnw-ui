import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Tag, Loader2 } from 'lucide-react';
import { accessoriesAPI, accessoryImageUrl, cartAPI, numbersAPI, ordersAPI, paymentsAPI } from '@/core/api/vnwAPI';
import { useStore } from '@/shared/store/useStore';
import { useAppSelector } from '@/app/hooks';
import { useToast } from '@/shared/hooks/use-toast';
import { formatINR } from '@/core/lib/format';
import { getPrimaryCategory } from '@/core/categories/types';
import { Loader, EmptyState } from '@/shared/components/ui-bits';
import { getNumberPurchaseMode } from '@/core/lib/numberPurchaseMode';

export default function Checkout() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshCounts } = useStore();
  const { user } = useAppSelector((s) => s.auth);
  const numberId = params.get('number_id');
  const accessoryId = params.get('accessory_id');
  const accessoryQuantity = Math.max(1, Number(params.get('quantity')) || 1);

  const [items, setItems] = useState<any[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [coupon, setCoupon] = useState('');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [shipping, setShipping] = useState({ name: user?.name || '', phone: user?.phone || '', address_line1: '', address_line2: '', city: '', state: '', postal_code: '' });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (accessoryId) {
          const p = await accessoriesAPI.detailById(Number(accessoryId));
          setItems([{ ...p, item_type: 'ACCESSORY', quantity: accessoryQuantity, line_total: Number(p.offer_price) * accessoryQuantity }]); setSubtotal(Number(p.offer_price) * accessoryQuantity);
        } else if (numberId) {
          const n = await numbersAPI.detail(Number(numberId));
          if (getNumberPurchaseMode(n) === 'PREBOOK') {
            navigate(`/pre-book/${n.number_id}/checkout`, { replace: true });
            return;
          }
          setItems([{ ...n, item_type: 'NUMBER' }]); setSubtotal(Number(n.offer_price));
        } else {
          const c = await cartAPI.list();
          setItems(c.items || []); setSubtotal(c.subtotal || 0);
        }
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, [numberId, accessoryId]);

  const hasAccessories = items.some((item) => item.item_type === 'ACCESSORY');

  const pay = async () => {
    setPaying(true);
    try {
      // 1) create the order (server reserves the numbers)
      if (hasAccessories && (!shipping.name.trim() || !/^\+?[0-9 ]{10,15}$/.test(shipping.phone) || !shipping.address_line1.trim() || !shipping.city.trim() || !shipping.state.trim() || !/^[1-9][0-9]{5}$/.test(shipping.postal_code))) throw new Error('Please complete the delivery address with a valid phone and six-digit postal code.');
      const order = await ordersAPI.create({ number_id: numberId ? Number(numberId) : undefined, accessory_id: accessoryId ? Number(accessoryId) : undefined, accessory_quantity: accessoryQuantity, coupon_code: coupon || undefined, shipping: hasAccessories ? shipping : undefined });
      // 2) create the Razorpay order
      const rp = await paymentsAPI.createRazorpayOrder(order.order_id);

      const Razorpay = (window as any).Razorpay;
      if (!Razorpay) throw new Error('Payment SDK failed to load. Please refresh.');

      const rzp = new Razorpay({
        key: rp.key_id,
        amount: rp.amount,
        currency: rp.currency,
        name: 'VIP Number World',
        description: `Order ${rp.order_no}`,
        order_id: rp.razorpay_order_id,
        prefill: { name: rp.customer?.name || user?.name, email: rp.customer?.email || user?.email, contact: rp.customer?.contact || user?.phone },
        theme: { color: '#D4AF37' },
        handler: async (resp: any) => {
          try {
            await paymentsAPI.verify({
              order_id: order.order_id,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            });
            await refreshCounts();
            toast({ title: 'Payment successful 🎉', description: `Order ${rp.order_no} confirmed.` });
            navigate(`/orders/${order.order_id}?success=1`);
          } catch (e: any) {
            toast({ title: 'Verification failed', description: e.message, variant: 'destructive' });
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.on('payment.failed', () => { toast({ title: 'Payment failed', variant: 'destructive' }); setPaying(false); });
      rzp.open();
    } catch (e: any) {
      toast({ title: 'Checkout error', description: e.message, variant: 'destructive' });
      setPaying(false);
    }
  };

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-10"><Loader /></div>;
  if (items.length === 0) return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <EmptyState title="Nothing to checkout" action={<Link to="/shop" className="btn-gold">Browse Numbers</Link>} />
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-extrabold text-foreground">Checkout</h1>
      <div className="vnw-card p-6">
        <h3 className="mb-4 font-semibold text-foreground">Order Items</h3>
        <div className="space-y-2">
          {items.map((it) => (
            <div key={`${it.item_type}-${it.item_id || it.number_id || it.accessory_id}`} className="flex items-center justify-between border-b border-card-border py-2 last:border-0">
              <div>
                {it.item_type === 'ACCESSORY' ? <div className="flex items-center gap-3">{it.primary_image_id&&<img src={accessoryImageUrl(it.primary_image_id)} className="h-12 w-12 rounded-lg object-contain" alt=""/>}<div><div className="font-bold text-foreground">{it.name}</div><div className="text-xs text-muted-foreground">{it.brand} · Qty {it.quantity}</div></div></div> : <><div className="text-lg font-bold text-foreground">{it.display_number}</div><div className="text-xs text-muted-foreground">{it.title_label || getPrimaryCategory(it)?.name || 'VIP Number'}</div></>}
              </div>
              <span className="font-semibold text-foreground">{formatINR(it.line_total ?? it.offer_price)}</span>
            </div>
          ))}
        </div>

        {hasAccessories && <fieldset className="mt-6 border-t border-card-border pt-5"><legend className="mb-3 font-semibold text-foreground">Free delivery address</legend><div className="grid gap-3 sm:grid-cols-2">{([['name','Recipient name'],['phone','Phone'],['address_line1','Address line 1'],['address_line2','Address line 2 (optional)'],['city','City'],['state','State'],['postal_code','Postal code']] as const).map(([key,label])=><label key={key} className={key.startsWith('address')?'sm:col-span-2 text-xs font-bold text-muted-foreground':'text-xs font-bold text-muted-foreground'}>{label}<input required={!['address_line2'].includes(key)} inputMode={key==='phone'||key==='postal_code'?'numeric':undefined} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-secondary px-3 text-sm outline-none focus:border-primary" value={shipping[key]} onChange={e=>setShipping({...shipping,[key]:e.target.value})}/></label>)}</div></fieldset>}

        <div className="mt-5 flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" />
          <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Coupon code (e.g. WELCOME10)"
            className="flex-1 rounded-lg border border-card-border bg-secondary px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>

        <div className="mt-5 flex justify-between border-t border-card-border pt-4">
          <span className="text-muted-foreground">Total Payable</span>
          <span className="text-2xl font-extrabold text-foreground">{formatINR(subtotal)}</span>
        </div>

        <button onClick={pay} disabled={paying} className="btn-gold mt-5 w-full">
          {paying ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</> : 'Pay Securely with Razorpay'}
        </button>
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" /> Payments secured by Razorpay · 256-bit encryption
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">By paying, you agree to the <Link className="text-primary" to="/terms-and-conditions">Terms</Link>, <Link className="text-primary" to="/refund-policy">Refund Policy</Link>, and <Link className="text-primary" to="/delivery-fulfilment-policy">Delivery Policy</Link>.</p>
      </div>
    </div>
  );
}
