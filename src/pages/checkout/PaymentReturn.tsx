import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock3, ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';
import { paymentsAPI } from '@/core/api/vnwAPI';
import { useStore } from '@/shared/store/useStore';
import CompactPageHeader from '@/shared/components/CompactPageHeader';
import { loadCashfree, openCashfreeCheckout } from '@/core/payments/cashfree';

export default function PaymentReturn() {
  const [params] = useSearchParams();
  const id = Number(params.get('order_id'));
  const { refreshCounts } = useStore();
  const [attempt, setAttempt] = useState(0);
  const [checking, setChecking] = useState(true);
  const [state, setState] = useState<any>(null);
  const [error, setError] = useState('');
  const [opening, setOpening] = useState(false);
  const resume = async () => {
    setOpening(true); setError('');
    try {
      await loadCashfree();
      const session = await paymentsAPI.createCashfreeOrder(id);
      if (['PAID', 'REFUNDED'].includes(session.payment_status)) setAttempt(v => v + 1);
      else await openCashfreeCheckout(session);
    } catch (e: any) { setError(e.message || 'Could not reopen checkout.'); }
    finally { setOpening(false); }
  };
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    setChecking(true); setError('');
    if (!Number.isSafeInteger(id) || id <= 0) { setError('The order reference is invalid.'); setChecking(false); return; }
    const check = async (remaining: number) => {
      try {
        const result = await paymentsAPI.verify({ order_id: id });
        if (cancelled) return;
        setState(result);
        if (result.payment_status === 'PENDING' && remaining > 0) { timer = setTimeout(() => check(remaining - 1), 2500); return; }
        if (result.payment_status === 'PAID') refreshCounts().catch(() => undefined);
      } catch (e: any) { if (!cancelled) setError(e.message || 'Could not check your payment.'); }
      if (!cancelled) setChecking(false);
    };
    check(4);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [id, attempt]);
  const paid = state?.payment_status === 'PAID';
  const review = state?.payment_status === 'REVIEW';
  const expired = state?.payment_status === 'EXPIRED';
  const refunded = state?.payment_status === 'REFUNDED';
  const Icon = checking ? Loader2 : paid ? CheckCircle2 : review || error ? AlertTriangle : Clock3;
  return <main className="commerce-page">
    <CompactPageHeader title="Payment status" subtitle="Securely check your Cashfree payment." icon={ShieldCheck} />
    <section className="commerce-panel mx-auto max-w-xl space-y-4 text-center" aria-live="polite">
      <Icon className={`mx-auto h-10 w-10 text-primary ${checking ? 'animate-spin' : ''}`} />
      <h2 className="text-xl font-black">{checking ? 'Checking your payment' : error ? 'Unable to check payment' : paid ? 'Payment confirmed' : review ? 'Payment received — review needed' : expired ? 'Payment session expired' : refunded ? 'Payment refunded' : 'Payment awaiting confirmation'}</h2>
      <p className="text-sm text-muted-foreground">{error || (paid ? `Order ${state.order_no} is confirmed. You can track its progress in your account.` : review ? 'Your payment was received after the reservation changed. Please contact support for fulfilment or a refund.' : expired ? 'Your unpaid reservation has ended. Please begin a new checkout.' : refunded ? 'This order has already been refunded.' : 'If you completed payment, allow a moment for confirmation. Check the status before starting another checkout.')}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {!checking && !paid && !refunded && !expired && <button className="btn-gold" onClick={() => setAttempt(v => v + 1)}>Check again</button>}
        {!checking && state?.payment_status === 'PENDING' && <button disabled={opening} className="btn-gold-outline" onClick={resume}>{opening ? 'Opening checkout…' : 'Continue payment'}</button>}
        {state && <Link className="btn-gold-outline" to={state.order_type === 'PREBOOK' ? '/pre-book#mine' : `/orders/${id}`}>View order</Link>}
        {review && <Link className="btn-gold" to="/contact">Contact support</Link>}
        {expired && <Link className="btn-gold" to="/shop">Browse numbers</Link>}
      </div>
    </section>
  </main>;
}
