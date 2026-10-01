export interface CashfreeSession {
  order_id: number;
  order_no: string;
  payment_status: string;
  payment_session_id?: string;
  environment?: 'sandbox' | 'production';
}
type CashfreeFactory = (options: { mode: 'sandbox' | 'production' }) => { checkout: (options: { paymentSessionId: string; redirectTarget: '_self' }) => Promise<{ error?: { message?: string } } | undefined> };
let loading: Promise<CashfreeFactory> | undefined;

export function loadCashfree(): Promise<CashfreeFactory> {
  const ready = (window as unknown as { Cashfree?: CashfreeFactory }).Cashfree;
  if (ready) return Promise.resolve(ready);
  if (loading) return loading;
  loading = new Promise<CashfreeFactory>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js'; script.async = true;
    const fail = () => { clearTimeout(timeout); script.remove(); loading = undefined; reject(new Error('Could not load secure checkout. Please retry.')); };
    const timeout = window.setTimeout(fail, 15000);
    script.onerror = fail;
    script.onload = () => {
      clearTimeout(timeout);
      const factory = (window as unknown as { Cashfree?: CashfreeFactory }).Cashfree;
      if (factory) resolve(factory); else fail();
    };
    document.head.appendChild(script);
  });
  return loading;
}

export async function openCashfreeCheckout(session: CashfreeSession) {
  if (!session.payment_session_id || !['sandbox', 'production'].includes(session.environment || '')) throw new Error('The payment session is unavailable. Please retry.');
  const factory = await loadCashfree();
  const result = await factory({ mode: session.environment! }).checkout({ paymentSessionId: session.payment_session_id, redirectTarget: '_self' });
  if (result?.error) throw new Error('Cashfree could not open checkout. Please retry or contact support.');
}
