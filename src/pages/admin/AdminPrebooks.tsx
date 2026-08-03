import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCcw, Search, ShieldX, Undo2 } from 'lucide-react';
import { adminAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { Loader, Money, PageHeader, StatusBadge, Table } from '@/shared/components/ui-bits';
import { formatRtpDate } from '@/core/lib/numberPurchaseMode';

export default function AdminPrebooks() {
  const { toast } = useToast();
  const [tab, setTab] = useState<'prebooks' | 'refunds'>('prebooks');
  const [items, setItems] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'prebooks') setItems(await adminAPI.prebooksList({ q, status: status || undefined }));
      else setRefunds(await adminAPI.prebookRefundsList({ status: status || undefined }));
    } catch (e: any) { toast({ title: 'Could not load queue', description: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [tab, q, status]);
  useEffect(() => { load(); }, [load]);

  const action = async (id: number, fn: () => Promise<any>, success: string) => {
    setBusy(id);
    try { await fn(); toast({ title: success }); await load(); }
    catch (e: any) { toast({ title: 'Action failed', description: e.message, variant: 'destructive' }); }
    finally { setBusy(null); }
  };
  const markUnavailable = (row: any) => {
    const note = window.prompt(`Why is ${row.display_number} unavailable?`);
    if (!note?.trim()) return;
    action(row.prebook_id, () => adminAPI.prebookMarkUnavailable(row.prebook_id, note), '100% refund review opened');
  };
  const reject = (row: any) => {
    const note = window.prompt('Rejection reason (required)');
    if (!note?.trim()) return;
    action(row.refund_request_id, () => adminAPI.prebookRefundReject(row.refund_request_id, note), 'Refund request rejected');
  };

  return <div>
    <PageHeader title="Pre-books & Refunds" subtitle="Manage RTP readiness, fulfilment, issue refunds, and Razorpay retry status" action={<button className="btn-gold-outline text-sm" onClick={load}><RefreshCcw className="h-4 w-4" /> Reconcile</button>} />
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
      <button onClick={() => { setTab('prebooks'); setStatus(''); }} className={tab === 'prebooks' ? 'btn-gold text-sm' : 'btn-gold-outline text-sm'}>Pre-book queue</button>
      <button onClick={() => { setTab('refunds'); setStatus(''); }} className={tab === 'refunds' ? 'btn-gold text-sm' : 'btn-gold-outline text-sm'}>Refund queue</button>
      <label className="relative ml-auto min-w-[220px]"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input aria-label="Search queue" className="input-luxury h-9 w-full pl-9" placeholder="Number, order, customer" value={q} onChange={(e) => setQ(e.target.value)} /></label>
      <select aria-label="Filter status" className="input-luxury h-9" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{(tab === 'prebooks' ? ['PENDING_PAYMENT','BOOKED','READY','CANCEL_REQUESTED','REFUND_PENDING','REFUNDED','FULFILLED','FAILED'] : ['PENDING','PROCESSING','FAILED','PROCESSED','REJECTED']).map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}</select>
    </div>
    {loading ? <Loader /> : tab === 'prebooks' ? <Table head={['Number / order', 'Customer', 'RTP date', 'Paid', 'State', 'Actions']}>
      {items.map((row) => <tr key={row.prebook_id} className="border-b border-border last:border-0"><td className="px-4 py-3"><b className="block text-foreground">{row.display_number}</b><span className="text-xs text-muted-foreground">{row.order_no}</span></td><td className="px-4 py-3"><span className="block text-sm font-bold">{row.full_name}</span><span className="text-xs text-muted-foreground">{row.email || row.phone}</span></td><td className="px-4 py-3 text-sm">{formatRtpDate(row.rtp_available_at_snapshot || row.rtp_available_at)}</td><td className="px-4 py-3"><Money value={row.total} /></td><td className="px-4 py-3"><StatusBadge status={row.status} /></td><td className="px-4 py-3"><div className="flex flex-wrap justify-end gap-2">{row.status === 'READY' && <button disabled={busy === row.prebook_id} className="btn-gold px-3 py-2 text-xs" onClick={() => action(row.prebook_id, () => adminAPI.prebookFulfill(row.prebook_id), 'Pre-book fulfilled')}><CheckCircle2 className="h-3.5 w-3.5" /> Fulfil</button>}{['BOOKED','READY'].includes(row.status) && <button disabled={busy === row.prebook_id} className="btn-gold-outline px-3 py-2 text-xs" onClick={() => markUnavailable(row)}><ShieldX className="h-3.5 w-3.5" /> Unavailable</button>}</div></td></tr>)}
    </Table> : <Table head={['Number / customer', 'Reason', 'Amount', 'Gateway', 'State', 'Actions']}>
      {refunds.map((row) => <tr key={row.refund_request_id} className="border-b border-border last:border-0"><td className="px-4 py-3"><b className="block">{row.display_number}</b><span className="text-xs text-muted-foreground">{row.full_name} · {row.order_no}</span></td><td className="max-w-xs px-4 py-3 text-xs"><b className="block text-foreground">{String(row.reason_type).replace(/_/g, ' ')}</b><span className="text-muted-foreground">{row.customer_note || 'No additional note'}</span></td><td className="px-4 py-3"><Money value={row.amount} /></td><td className="px-4 py-3 text-xs text-muted-foreground">{row.gateway_status || 'Not submitted'}</td><td className="px-4 py-3"><StatusBadge status={row.status} /></td><td className="px-4 py-3"><div className="flex flex-wrap justify-end gap-2">{row.status === 'PENDING' && <><button disabled={busy === row.refund_request_id} className="btn-gold px-3 py-2 text-xs" onClick={() => action(row.refund_request_id, () => adminAPI.prebookRefundApprove(row.refund_request_id), 'Refund submitted to Razorpay')}><Undo2 className="h-3.5 w-3.5" /> Approve 100%</button><button disabled={busy === row.refund_request_id} className="btn-gold-outline px-3 py-2 text-xs" onClick={() => reject(row)}><AlertTriangle className="h-3.5 w-3.5" /> Reject</button></>}{row.status === 'FAILED' && <button disabled={busy === row.refund_request_id} className="btn-gold px-3 py-2 text-xs" onClick={() => action(row.refund_request_id, () => adminAPI.prebookRefundRetry(row.refund_request_id), 'Refund retry submitted')}><RefreshCcw className="h-3.5 w-3.5" /> Retry</button>}</div></td></tr>)}
    </Table>}
  </div>;
}
