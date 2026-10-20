import { formatNumberDisplay } from '@/core/categories/numberDisplay';
import { loadCashfree, openCashfreeCheckout } from '@/core/payments/cashfree';
import { useAppSelector } from '@/app/hooks';
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Tag, Loader2, CreditCard } from 'lucide-react';
import { numbersAPI, ordersAPI, paymentsAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { formatINR } from '@/core/lib/format';
import CompactPageHeader from '@/shared/components/CompactPageHeader';
import BillingSummary from '@/shared/components/BillingSummary';
import { getPrimaryCategory } from '@/core/categories/types';
import { Loader, EmptyState } from '@/shared/components/ui-bits';
import { getNumberPurchaseMode } from '@/core/lib/numberPurchaseMode';
import { hasBillingPhone } from '@/core/lib/billingPhone';

export default function Checkout() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAppSelector(s => s.auth);
  const needsPhone = !hasBillingPhone(user?.phone);
  const numberId = params.get('number_id');

  const [items, setItems] = useState<any[]>([]);
  const [billing, setBilling] = useState<any>(null);
  const [error, setError] = useState('');
  const [couponError, setCouponError] = useState('');
  const [quoting, setQuoting] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [reservation, setReservation] = useState<any>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setReservation(null); setCoupon(''); setCouponError(''); setError('');
      try {
        if (numberId) {
          const n = await numbersAPI.detail(Number(numberId));
          if (getNumberPurchaseMode(n) === 'PREBOOK') {
            navigate(`/pre-book/${n.number_id}/checkout`, { replace: true });
            return;
          }
        }
        const quote = await ordersAPI.quote({ number_id: numberId ? Number(numberId) : undefined });
        setItems(quote.items || []); setBilling(quote);

      } catch (e: any) { setError(e.message || 'Could not load checkout.'); } finally { setLoading(false); }
    })();
  }, [numberId, navigate]);

  const applyCoupon = async (code: string) => {
    if (reservation) return;
    setQuoting(true); setCouponError('');
    try { const quote = await ordersAPI.quote({ number_id: numberId ? Number(numberId) : undefined, coupon_code: code || undefined }); setBilling(quote); setItems(quote.items || []); setCoupon(quote.coupon_code || ''); }
    catch (e: any) { setCouponError(e.message || 'Could not apply coupon.'); }
    finally { setQuoting(false); }
  };

  const pay = async () => {
    if (needsPhone) return;
    setPaying(true);
    try {
      await loadCashfree();
      const order = reservation || await ordersAPI.create({ number_id: numberId ? Number(numberId) : undefined, coupon_code: billing?.coupon_code || undefined });
      setReservation(order); setBilling(order);
      const session = await paymentsAPI.createCashfreeOrder(order.order_id);
      if (['PAID', 'REFUNDED'].includes(session.payment_status)) navigate(`/payments/return?order_id=${order.order_id}`);
      else await openCashfreeCheckout(session);
    } catch (e: any) { toast({ title: 'Checkout error', description: e.message, variant: 'destructive' }); }
    finally { setPaying(false); }
  };

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-10"><Loader /></div>;
  if (error) return <div className="commerce-page"><CompactPageHeader title="Checkout" subtitle="Review your numbers and billing." icon={CreditCard} /><p role="alert" className="commerce-panel text-destructive">{error}</p><Link to="/cart" className="btn-gold mt-3">Back to cart</Link></div>;
  if (items.length === 0) return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <EmptyState title="Nothing to checkout" action={<Link to="/shop" className="btn-gold">Browse Numbers</Link>} />
    </div>
  );

  return <div className="commerce-page">
    <CompactPageHeader title="Checkout" subtitle="Review your selection, apply a coupon and pay securely." icon={CreditCard} />
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_340px]">
      <section className="commerce-panel"><h2 className="mb-3 text-sm font-black">Your numbers <span className="text-muted-foreground">({items.length})</span></h2>
        {items.map(it => <div key={it.number_id} className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0"><div className="min-w-0"><Link to={`/number/${it.number_id}`} className="text-base font-black"><span data-no-translate>{formatNumberDisplay(it.display_number, getPrimaryCategory(it))}</span></Link><p className="text-xs text-muted-foreground">{it.title_label || getPrimaryCategory(it)?.name || 'VIP Number'}</p></div><div className="shrink-0 text-right"><strong className="text-sm text-primary">{formatINR(it.offer_price)}</strong><del className="block text-xs text-muted-foreground">{formatINR(it.mrp)}</del></div></div>)}
        <div className="mt-4 rounded-xl bg-muted/60 p-3 text-xs"><strong>Billing contact</strong><p translate="no" className="mt-1 text-muted-foreground">{user?.name || user?.full_name} · {user?.email}</p>{user?.phone && <p className="text-muted-foreground">{user.phone}</p>}<Link to="/account" className="mt-2 inline-block font-bold text-primary">Edit profile</Link></div>
      </section>
      <aside className="commerce-panel space-y-4 lg:sticky lg:top-24"><h2 className="text-sm font-black">Billing summary</h2>
        <form onSubmit={e => { e.preventDefault(); void applyCoupon(coupon); }} className="space-y-2"><label htmlFor="checkout-coupon" className="flex items-center gap-1 text-xs font-bold"><Tag className="h-3 w-3 text-primary" />Coupon code</label><div className="flex gap-2"><input id="checkout-coupon" disabled={Boolean(reservation)} value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())} placeholder="Enter code" className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs" /><button disabled={quoting || paying || Boolean(reservation)} className="btn-gold-outline min-h-9 px-3 text-xs">{quoting ? 'Checking…' : 'Apply'}</button></div>{couponError && <p role="alert" className="text-xs text-destructive">{couponError}</p>}{billing.coupon_code && <div className="flex justify-between text-xs text-success"><span>{billing.coupon_code} applied</span><button type="button" disabled={quoting || paying || Boolean(reservation)} onClick={() => void applyCoupon('')}>Remove</button></div>}</form>
        <BillingSummary billing={billing} />
        {needsPhone && <p role="status" className="text-xs leading-relaxed text-muted-foreground">Please add a valid mobile number to your profile before paying. <Link to="/account" className="font-bold text-primary">Edit profile</Link></p>}
        <button onClick={pay} disabled={paying || quoting || needsPhone} className="btn-gold w-full text-sm">{paying ? <><Loader2 className="h-4 w-4 animate-spin" />Processing…</> : `Pay ${formatINR(billing.total)}`}</button>
        <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-primary" />Secure payment with Cashfree</p>
        <p className="text-center text-[10px] leading-relaxed text-muted-foreground">By paying, you agree to the <Link className="text-primary" to="/terms-and-conditions">Terms</Link>, <Link className="text-primary" to="/refund-policy">Refund Policy</Link> and <Link className="text-primary" to="/delivery-fulfilment-policy">Delivery Policy</Link>.</p>
      </aside>
    </div>
  </div>;
}
