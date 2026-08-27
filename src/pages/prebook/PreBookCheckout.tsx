import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CalendarClock, CheckCircle2, Clock3, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { numbersAPI, paymentsAPI, prebooksAPI } from '@/core/api/vnwAPI';
import { useAppSelector } from '@/app/hooks';
import { useToast } from '@/shared/hooks/use-toast';
import { EmptyState, Loader } from '@/shared/components/ui-bits';
import { formatINR } from '@/core/lib/format';
import { formatRtpDate, getNumberPurchaseMode } from '@/core/lib/numberPurchaseMode';

export default function PreBookCheckout() {
  const { numberId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAppSelector((s) => s.auth);
  const [number, setNumber] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [reservation, setReservation] = useState<any>(null);

  useEffect(() => {
    numbersAPI.detail(Number(numberId)).then(setNumber).catch(() => setNumber(null)).finally(() => setLoading(false));
  }, [numberId]);

  const pay = async () => {
    setPaying(true);
    try {
      const hold = reservation || await prebooksAPI.create(Number(numberId));
      setReservation(hold);
      const rp = await paymentsAPI.createRazorpayOrder(hold.order_id);
      const Razorpay = (window as any).Razorpay;
      if (!Razorpay) throw new Error('Payment SDK failed to load. Please refresh this page.');
      const rzp = new Razorpay({
        key: rp.key_id, amount: rp.amount, currency: rp.currency, name: 'VIP Number World',
        description: `Pre-book ${number.display_number}`, order_id: rp.razorpay_order_id,
        prefill: { name: rp.customer?.name || user?.name, email: rp.customer?.email || user?.email, contact: rp.customer?.contact || user?.phone },
        theme: { color: '#A96505' },
        handler: async (response: any) => {
          try {
            await paymentsAPI.verify({ order_id: hold.order_id, razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature });
            toast({ title: 'Pre-book confirmed', description: `${number.display_number} is exclusively reserved for you.` });
            navigate('/pre-book#mine');
          } catch (e: any) { toast({ title: 'Payment verification failed', description: e.message, variant: 'destructive' }); }
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.on('payment.failed', () => { toast({ title: 'Payment failed', description: 'Your unpaid hold will be released automatically.', variant: 'destructive' }); setPaying(false); });
      rzp.open();
    } catch (e: any) { toast({ title: 'Could not start pre-booking', description: e.message, variant: 'destructive' }); setPaying(false); }
  };

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-16"><Loader /></div>;
  if (!number || getNumberPurchaseMode(number) !== 'PREBOOK') return <div className="mx-auto max-w-3xl px-4 py-12"><EmptyState title="This number is not available for pre-booking" subtitle="It may already be RTP, reserved, or unavailable." action={<button className="btn-gold" onClick={() => navigate('/pre-book')}>Browse pre-book numbers</button>} /></div>;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-5"><span className="text-xs font-black uppercase tracking-wider text-primary">Protected checkout</span><h1 className="text-3xl font-black text-foreground">Reserve your VIP number</h1></div>
      <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <section className="overflow-hidden rounded-[1.75rem] border border-primary/25 bg-gradient-to-br from-card via-card to-primary/10 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3"><div><div className="text-sm font-bold text-muted-foreground">NON-RTP VIP number</div><div className="vnw-card-numeral mt-2 text-3xl tracking-[.1em] text-foreground sm:text-5xl">{number.display_number}</div></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">PRE-BOOK</span></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-border bg-background/70 p-4"><div className="flex items-center gap-2 text-xs font-bold text-muted-foreground"><CalendarClock className="h-4 w-4 text-primary" /> Ready to port</div><div className="mt-1 text-lg font-black text-foreground">{formatRtpDate(number.rtp_available_at)}</div></div><div className="rounded-2xl border border-border bg-background/70 p-4"><div className="text-xs font-bold text-muted-foreground">Full payment</div><div className="mt-1 text-2xl font-black text-foreground">{formatINR(number.offer_price)}</div></div></div>
          <div className="mt-5 border-t border-border pt-5"><h2 className="font-black text-foreground">What happens next</h2><div className="mt-3 grid gap-3 text-sm text-muted-foreground">
            <p className="flex gap-2"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Starting payment creates a 15-minute exclusive hold. Successful full payment keeps the number reserved only for you.</span></p>
            <p className="flex gap-2"><CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>At midnight India time on the shown date, the number becomes RTP and moves to Ready status.</span></p>
            <p className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Our team completes fulfilment after UPC delivery, MNP initiation, and activation checks.</span></p>
          </div></div>
        </section>
        <aside className="h-fit rounded-[1.75rem] border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-black text-foreground">Payment summary</h2><div className="mt-4 flex justify-between text-sm text-muted-foreground"><span>Offer price</span><span>{formatINR(number.offer_price)}</span></div><div className="mt-2 flex justify-between text-sm text-muted-foreground"><span>Coupon</span><span>Not applicable</span></div><div className="mt-4 flex justify-between border-t border-border pt-4"><b>Total payable</b><strong className="text-2xl">{formatINR(number.offer_price)}</strong></div>
          <button onClick={pay} disabled={paying} className="btn-gold mt-5 w-full">{paying ? <><Loader2 className="h-4 w-4 animate-spin" /> Opening payment…</> : 'Pay & reserve exclusively'}</button>
          <p className="mt-3 text-center text-xs text-muted-foreground">The 48-hour cancellation and fulfilment-failure rules are explained in our <Link to="/refund-policy" className="text-primary">Refund Policy</Link> and <Link to="/mnp-activation-policy" className="text-primary">MNP Policy</Link>.</p>
          {reservation && <p className="mt-2 text-center text-xs font-bold text-primary"><Clock3 className="mr-1 inline h-3.5 w-3.5" />Payment hold created for 15 minutes</p>}
          <div className="mt-5 space-y-3 rounded-2xl bg-muted p-4 text-xs leading-5 text-muted-foreground"><p><b className="text-foreground">48-hour cancellation:</b> request cancellation within exactly 48 hours of successful payment for a 100% refund, subject to admin approval.</p><p><b className="text-foreground">100% issue guarantee:</b> if delivery, UPC, activation, or number availability fails before fulfilment, report it for a full refund review.</p><p><ShieldCheck className="mr-1 inline h-4 w-4 text-primary" />Refunds return to the original payment method. Bank processing time may vary.</p></div>
        </aside>
      </div>
    </main>
  );
}
