import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowDownLeft, BadgeIndianRupee, CreditCard, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { adminAPI } from '@/core/api/vnwAPI';
import { formatINR } from '@/core/lib/format';
import { Loader, StatCard, StatusBadge, Table } from '@/shared/components/ui-bits';
import { ThemedSelect } from '@/shared/ui/themed-select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/ui/dialog';

const time = (value: any) => {
  if (!value) return '—';
  const text = String(value).replace(' ', 'T');
  const date = new Date(/Z$|[+-]\d\d:\d\d$/.test(text) ? text : `${text}Z`);
  return Number.isFinite(date.getTime()) ? date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : '—';
};
const readable = (value: string) => value.replace(/_/g, ' ').toLowerCase();
const initialFilters = { environment: 'sandbox', status: '', q: '', from: '', to: '' };

export default function AdminPayments() {
  const [draft, setDraft] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const selectedRef = useRef(selected); selectedRef.current = selected;
  const [detail, setDetail] = useState<any>(null);
  const [detailError, setDetailError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    adminAPI.paymentOverview({ ...filters, page, limit }).then((result) => { if (active) setData(result); })
      .catch((e) => { if (active) setError(e.message || 'Could not load payments.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters, page, limit, version]);
  useEffect(() => {
    let active = true; setDetail(null); setDetailError('');
    if (selected) adminAPI.paymentDetail(selected).then((result) => { if (active) setDetail(result); })
      .catch((e) => { if (active) setDetailError(e.message || 'Could not load payment history.'); });
    return () => { active = false; };
  }, [selected]);
  const reconcile = useCallback(async () => {
    if (!selected) return;
    setBusy(true); setDetailError('');
    try { await adminAPI.paymentReconcile(selected); const result = await adminAPI.paymentDetail(selected); if (selectedRef.current === selected) setDetail(result); setVersion((v) => v+1); }
    catch (e: any) { if (selectedRef.current === selected) setDetailError(e.message || 'Could not refresh gateway status.'); }
    finally { setBusy(false); }
  }, [selected]);
  const moreHistory = async () => {
    if (!selected || !detail?.next_event_id) return;
    setLoadingEvents(true);
    try { const next = await adminAPI.paymentDetail(selected, detail.next_event_id); if (selectedRef.current === selected) setDetail((old: any) => ({ ...old, events: [...old.events, ...next.events], next_event_id: next.next_event_id })); }
    catch (e: any) { if (selectedRef.current === selected) setDetailError(e.message); }
    finally { setLoadingEvents(false); }
  };
  const stats = data?.stats || {};
  const patch = (key: keyof typeof initialFilters, value: string) => setDraft((old) => ({ ...old, [key]: value }));
  const maxDaily = Math.max(1, ...(data?.daily || []).map((row: any) => Number(row.captured)));
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="h-4 w-4 text-primary" /> Payment analysis <span className="rounded-full bg-muted px-2 py-1 text-xs capitalize">{filters.environment}</span></div>
      <button onClick={() => setVersion((v) => v+1)} className="btn-gold-outline text-sm" disabled={loading}><RefreshCw className="h-4 w-4" /> Refresh</button>
    </div>
    <form className="vnw-card flex flex-wrap items-end gap-3 p-3" onSubmit={(e) => { e.preventDefault(); setPage(1); setFilters({ ...draft }); }}>
      <label className="grid gap-1 text-xs font-bold">Environment<ThemedSelect aria-label="Payment environment" className="input-luxury h-10" value={draft.environment} onChange={(e) => patch('environment', e.target.value)}><option value="sandbox">Sandbox · test payments</option><option value="production">Production · live payments</option><option value="legacy">Historical provider</option></ThemedSelect></label>
      <label className="grid gap-1 text-xs font-bold">Payment status<ThemedSelect aria-label="Payment status" className="input-luxury h-10" value={draft.status} onChange={(e) => patch('status', e.target.value)}><option value="">All statuses</option>{['UNPAID','PAID','FAILED','REFUNDED','REVIEW'].map((s) => <option key={s} value={s}>{s === 'REVIEW' ? 'Needs review' : s}</option>)}</ThemedSelect></label>
      <label className="grid gap-1 text-xs font-bold">Orders from (IST)<input aria-label="Orders from" type="date" className="input-luxury h-10" value={draft.from} onChange={(e) => patch('from', e.target.value)} /></label>
      <label className="grid gap-1 text-xs font-bold">Orders through (IST)<input aria-label="Orders through" type="date" className="input-luxury h-10" value={draft.to} onChange={(e) => patch('to', e.target.value)} /></label>
      <label className="grid min-w-48 flex-1 gap-1 text-xs font-bold">Find a transaction<input aria-label="Find a transaction" className="input-luxury h-10" placeholder="Order, payment ID or customer" value={draft.q} onChange={(e) => patch('q', e.target.value)} /></label>
      <button className="btn-gold text-sm" type="submit"><Search className="h-4 w-4" /> Apply</button>
    </form>
    {error ? <div role="alert" className="vnw-card border-destructive/30 p-4 text-sm text-destructive">{error}</div> : loading ? <Loader /> : <>
      <div className="grid grid-cols-2 gap-3 [&_.tabular-nums]:text-lg sm:[&_.tabular-nums]:text-2xl xl:grid-cols-4">
        <StatCard label="Captured · INR" value={formatINR(stats.captured || 0)} icon={<CreditCard className="h-4 w-4" />} />
        <StatCard label="Refunded · INR" value={formatINR(stats.refunded || 0)} icon={<ArrowDownLeft className="h-4 w-4" />} />
        <StatCard label="Net captured · INR" value={formatINR(stats.net_captured || 0)} icon={<BadgeIndianRupee className="h-4 w-4" />} />
        <StatCard label="Paid orders / all orders" value={`${Number(stats.paid_orders || 0)} / ${Number(stats.total || 0)}`} icon={<Activity className="h-4 w-4" />} />
      </div>
      <div className="vnw-card flex flex-wrap gap-x-6 gap-y-2 p-3 text-sm">
        <span>Pending orders <b>{Number(stats.pending_orders || 0)}</b></span><span>Failed attempts <b>{Number(stats.failed_attempts || 0)}</b></span><span>Abandoned attempts <b>{Number(stats.dropped_attempts || 0)}</b></span><span className="text-destructive">Needs review <b>{Number(stats.review_orders || 0)}</b></span><span>Refunds pending <b>{formatINR(stats.refund_pending || 0)}</b></span>
      </div>
      <p className="text-xs text-muted-foreground">Amounts include verified successful payments, including those awaiting fulfilment review. Filters use the order creation date in IST. Sandbox payments are test data. Net captured excludes gateway fees and settlements.</p>
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="vnw-card p-4"><h2 className="mb-3 text-sm font-bold">Captured by order date · latest 30 days with orders</h2><div className="max-h-56 space-y-2 overflow-y-auto">{(data?.daily || []).map((row: any) => <div key={row.day} className="grid grid-cols-[6rem_1fr_6rem] items-center gap-2 text-xs"><span>{String(row.day).slice(0,10)}</span><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Number(row.captured)/maxDaily*100}%` }} /></div><span className="text-right font-bold">{formatINR(row.captured)}</span></div>)}{!data?.daily?.length && <p className="text-sm text-muted-foreground">No payments in this selection.</p>}</div></section>
        <section className="vnw-card p-4"><h2 className="mb-3 text-sm font-bold">Payment methods</h2><div className="max-h-56 space-y-3 overflow-y-auto">{(data?.methods || []).map((row: any) => <div key={row.method} className="flex justify-between gap-3 text-sm"><span className="capitalize">{row.method}<span className="ml-2 text-xs text-muted-foreground">{Number(row.successful)} / {Number(row.attempts)} successful</span></span><b>{formatINR(row.captured)}</b></div>)}{!data?.methods?.length && <p className="text-sm text-muted-foreground">No recorded attempts.</p>}</div></section>
      </div>
      <Table head={['Order / customer','Payable','Payment status','Attempts','Created · IST','History']} pagination={{ page, pageSize: limit, total: data?.total || 0, onPageChange: setPage, onPageSizeChange: (size) => { setLimit(size); setPage(1); } }}>
        {(data?.items || []).map((row: any) => <tr key={row.order_id} className="border-b border-border last:border-0"><td className="px-3 py-3"><b className="block text-sm">{row.order_no}</b><span className="text-xs text-muted-foreground">{row.customer_name || 'Customer'} · {readable(row.order_type)}</span></td><td className="px-3 py-3 text-sm font-bold">{formatINR(row.total)}</td><td className="px-3 py-3"><StatusBadge status={Number(row.needs_review) ? 'REVIEW' : row.payment_status} /></td><td className="px-3 py-3 text-sm">{Number(row.attempts)}</td><td className="px-3 py-3 text-xs">{time(row.created_at)}</td><td className="px-3 py-3"><button className="btn-gold-outline text-xs" onClick={() => setSelected(row.order_id)}>View history</button></td></tr>)}
      </Table>
      {!data?.items?.length && <p className="py-4 text-center text-sm text-muted-foreground">No transactions match these filters.</p>}
    </>}
    <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}><DialogContent className="admin-dialog max-h-[90dvh] max-w-5xl overflow-y-auto">
      <DialogHeader className="pr-5"><DialogTitle className="break-words">Transaction history{detail ? ` · ${detail.order.order_no}` : ''}</DialogTitle><DialogDescription>Billing, gateway attempts, refunds and processing events. Times shown in IST.</DialogDescription></DialogHeader>
      {detailError && <p role="alert" className="text-sm text-destructive">{detailError}</p>}
      {!detail && !detailError ? <Loader /> : detail && <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><b>{detail.order.customer_name || 'Customer'}</b><p className="text-xs text-muted-foreground">{detail.order.customer_email} · {detail.order.customer_phone}</p><p className="mt-1 break-all text-xs">Gateway order: {detail.order.gateway_order_id || 'Not created'}</p></div><div className="flex flex-wrap items-center gap-2"><StatusBadge status={detail.order.payment_status} />{detail.order.payment_provider === 'CASHFREE' && detail.order.gateway_order_id && <button className="btn-gold-outline text-xs" onClick={reconcile} disabled={busy}><RefreshCw className="h-3 w-3" /> {busy ? 'Checking…' : 'Check Cashfree'}</button>}<Link to="/admin/prebooks" className="text-xs font-bold text-primary" onClick={() => setSelected(null)}>Refund management</Link></div></div>
        <section className="rounded-xl border border-border p-3"><h3 className="mb-2 text-sm font-bold">Billing snapshot</h3>{Number(detail.order.mrp_total)>0 ? <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">{[['MRP total',detail.order.mrp_total],['Offer savings',detail.order.offer_savings],['Offer subtotal',detail.order.subtotal],['Coupon discount',detail.order.discount],['Taxable amount',detail.order.taxable_amount],[`GST (${Number(detail.order.gst_percent)}%)`,detail.order.gst_amount],['Total payable',detail.order.total]].map(([label,value]) => <div key={String(label)}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-bold">{formatINR(value as any)}</dd></div>)}</dl> : <p className="text-sm">Total: <b>{formatINR(detail.order.total)}</b>. This historical order has no stored tax breakdown.</p>}{detail.order.coupon_code && <p className="mt-2 text-xs">Coupon: {detail.order.coupon_code}</p>}<div className="mt-3 flex flex-wrap gap-2">{detail.items.map((item: any) => <span key={item.display_number} className="rounded-lg bg-muted px-2 py-1 text-xs">{item.display_number} · {formatINR(item.price)}</span>)}</div></section>
        <section><h3 className="mb-2 text-sm font-bold">Payment attempts</h3><div className="space-y-2">{detail.attempts.map((attempt: any) => <article key={attempt.payment_id} className="rounded-xl border border-border p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><b>{formatINR(attempt.amount)} · {attempt.method || 'Unknown method'}</b><StatusBadge status={attempt.status} /></div><p className="mt-1 break-all text-xs text-muted-foreground">Payment {attempt.gateway_payment_id} · {time(attempt.payment_time || attempt.created_at)}</p>{attempt.bank_reference && <p className="mt-1 text-xs">Bank reference: {attempt.bank_reference}</p>}{attempt.payment_message && <p className="mt-1 text-xs">{attempt.payment_message}</p>}<details className="mt-2 text-xs"><summary className="cursor-pointer text-primary">Payment details</summary><pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-muted p-2">{JSON.stringify(attempt.raw_payload, null, 2)}</pre></details></article>)}{!detail.attempts.length && <p className="text-sm text-muted-foreground">No gateway attempt has been recorded yet.</p>}</div></section>
        {!!detail.refunds.length && <section><h3 className="mb-2 text-sm font-bold">Refunds</h3>{detail.refunds.map((refund: any) => <div key={refund.refund_request_id} className="mb-2 rounded-xl border border-border p-3 text-xs"><div className="flex flex-wrap justify-between gap-2"><b>{formatINR(refund.amount)} · {readable(refund.reason_type)}</b><StatusBadge status={refund.status} /></div><p className="mt-2 break-all">Reference: {refund.gateway_refund_id || 'Awaiting approval'} · Gateway: {refund.gateway_status || 'Not submitted'}</p><p className="mt-1 text-muted-foreground">Requested {time(refund.requested_at)} · Processed {time(refund.processed_at)}</p></div>)}</section>}
        <section><h3 className="mb-2 text-sm font-bold">Processing timeline</h3><ol className="space-y-2">{detail.events.map((event: any) => <li key={event.event_id} className="rounded-xl border border-border p-3 text-xs"><div className="flex flex-wrap justify-between gap-2"><b className="capitalize">{readable(event.event_type)}</b><span>{event.status}</span></div><p className="mt-1 text-muted-foreground">{time(event.created_at)} · {event.source}{event.actor_user_id ? ` · User ${event.actor_user_id}` : ''}</p><details className="mt-2"><summary className="cursor-pointer text-primary">Event details</summary><p className="mt-2 break-all text-muted-foreground">Trace: {event.correlation_id}</p><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-muted p-2">{JSON.stringify(event.details, null, 2)}</pre></details></li>)}</ol>{!detail.events.length && <p className="text-sm text-muted-foreground">No processing events recorded.</p>}{detail.next_event_id && <button className="btn-gold-outline mt-3 text-xs" onClick={moreHistory} disabled={loadingEvents}>{loadingEvents ? 'Loading…' : 'Load earlier history'}</button>}</section>
      </div>}
    </DialogContent></Dialog>
  </div>;
}
