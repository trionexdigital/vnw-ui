import { loadCashfree, openCashfreeCheckout } from '@/core/payments/cashfree';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CalendarClock, CheckCircle2, Clock3, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { numbersAPI, paymentsAPI, prebooksAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { EmptyState, Loader } from '@/shared/components/ui-bits';
import { formatINR } from '@/core/lib/format';
import CompactPageHeader from '@/shared/components/CompactPageHeader';
import BillingSummary from '@/shared/components/BillingSummary';
import { formatRtpDate, getNumberPurchaseMode } from '@/core/lib/numberPurchaseMode';

export default function PreBookCheckout() {
  const { numberId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [number, setNumber] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [reservation, setReservation] = useState<any>(null);
  const [billing, setBilling] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([numbersAPI.detail(Number(numberId)), prebooksAPI.quote(Number(numberId))]).then(([n, quote]) => { setNumber(n); setBilling(quote); }).catch((e: any) => { setNumber(null); setError(e.message); }).finally(() => setLoading(false));
  }, [numberId]);

  const pay = async () => {
    setPaying(true);
    try {
      await loadCashfree();
      const hold = reservation || await prebooksAPI.create(Number(numberId));
      setReservation(hold); setBilling(hold);
      const session = await paymentsAPI.createCashfreeOrder(hold.order_id);
      if (['PAID', 'REFUNDED'].includes(session.payment_status)) navigate(`/payments/return?order_id=${hold.order_id}`);
      else await openCashfreeCheckout(session);
    } catch (e: any) { toast({ title: 'Could not start pre-booking', description: e.message, variant: 'destructive' }); }
    finally { setPaying(false); }
  };

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-16"><Loader /></div>;
  if (!number || getNumberPurchaseMode(number) !== 'PREBOOK') return <div className="mx-auto max-w-3xl px-4 py-12"><EmptyState title="This number is not available for pre-booking" subtitle={error || "It may already be ready to port or activate, reserved, or unavailable."} action={<button className="btn-gold" onClick={() => navigate('/pre-book')}>Browse pre-book numbers</button>} /></div>;

  return (
    <main className="commerce-page">
      <CompactPageHeader title="Pre-book checkout" subtitle="Reserve your number with a secure payment." icon={CalendarClock} />
      <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <section className="overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-card via-card to-primary/10 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3"><div><div className="text-sm font-bold text-muted-foreground">Pre-book VIP number</div><div className="mt-2 text-2xl font-black text-foreground sm:text-3xl">{number.display_number}</div></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">PRE-BOOK</span></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-border bg-background/70 p-4"><div className="flex items-center gap-2 text-xs font-bold text-muted-foreground"><CalendarClock className="h-4 w-4 text-primary" /> Ready to port</div><div className="mt-1 text-lg font-black text-foreground">{formatRtpDate(number.rtp_available_at)}</div></div><div className="rounded-2xl border border-border bg-background/70 p-4"><div className="text-xs font-bold text-muted-foreground">Full payment</div><div className="mt-1 text-2xl font-black text-foreground">{formatINR(billing.total)}</div></div></div>
          <div className="mt-5 border-t border-border pt-5"><h2 className="font-black text-foreground">What happens next</h2><div className="mt-3 grid gap-3 text-sm text-muted-foreground">
            <p className="flex gap-2"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Starting payment creates a 20-minute exclusive hold. Successful full payment keeps the number reserved only for you.</span></p>
            <p className="flex gap-2"><CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>At midnight India time on the shown date, the number moves to RTP status and is ready to begin the porting process.</span></p>
            <p className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Our team completes fulfilment after UPC delivery, MNP initiation, and activation checks.</span></p>
          </div></div>
        </section>
        <aside className="h-fit rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-black">Payment summary</h2><BillingSummary billing={billing} />
          <button onClick={pay} disabled={paying} className="btn-gold mt-5 w-full">{paying ? <><Loader2 className="h-4 w-4 animate-spin" /> Opening payment…</> : 'Pay & reserve exclusively'}</button>
          <p className="mt-3 text-center text-xs text-muted-foreground">The 48-hour cancellation and fulfilment-failure rules are explained in our <Link to="/refund-policy" className="text-primary">Refund Policy</Link> and <Link to="/mnp-activation-policy" className="text-primary">MNP Policy</Link>.</p>
          {reservation && <p className="mt-2 text-center text-xs font-bold text-primary"><Clock3 className="mr-1 inline h-3.5 w-3.5" />Payment hold created for 20 minutes</p>}
          <div className="mt-5 space-y-3 rounded-2xl bg-muted p-4 text-xs leading-5 text-muted-foreground"><p><b className="text-foreground">48-hour cancellation:</b> request cancellation within exactly 48 hours of successful payment for a 100% refund, subject to admin approval.</p><p><b className="text-foreground">100% issue guarantee:</b> if delivery, UPC, activation, or number availability fails before fulfilment, report it for a full refund review.</p><p><ShieldCheck className="mr-1 inline h-4 w-4 text-primary" />Refunds return to the original payment method. Bank processing time may vary.</p></div>
        </aside>
      </div>
    </main>
  );
}
