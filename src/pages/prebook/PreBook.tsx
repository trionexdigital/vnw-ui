import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, ChevronLeft, ChevronRight, Clock3, Filter, RotateCcw, Search, ShieldCheck } from 'lucide-react';
import { categoriesAPI, numbersAPI, prebooksAPI, type PrebookRecord } from '@/core/api/vnwAPI';
import { localService } from '@/core/services/local';
import { useToast } from '@/shared/hooks/use-toast';
import NumberCard, { type NumberItem } from '@/shared/components/NumberCard';
import { EmptyState, Loader, StatusBadge } from '@/shared/components/ui-bits';
import { formatINR } from '@/core/lib/format';
import { formatRtpDate } from '@/core/lib/numberPurchaseMode';

const blankFilters = { q: '', category: '', operator: '', price_min: '', price_max: '', rtp_from: '', rtp_to: '', sort: 'rtp_soon' };
const issueTypes = [
  ['DELIVERY_ISSUE', 'Delivery issue'], ['UPC_ISSUE', 'UPC delivery issue'], ['ACTIVATION_ISSUE', 'Activation issue'],
] as const;

function countdown(seconds: number) {
  if (seconds <= 0) return 'Cancellation window closed';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m cancellation time left`;
}

export default function PreBook() {
  const { toast } = useToast();
  const loggedIn = Boolean(localService.getToken());
  const [filters, setFilters] = useState(blankFilters);
  const [applied, setApplied] = useState(blankFilters);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<NumberItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [operators, setOperators] = useState<any[]>([]);
  const [mine, setMine] = useState<PrebookRecord[]>([]);
  const [mineLoading, setMineLoading] = useState(loggedIn);
  const [busy, setBusy] = useState<number | null>(null);
  const [issue, setIssue] = useState<{ id: number; type: string; note: string } | null>(null);
  const [tick, setTick] = useState(0);
  const limit = 12;

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const data = await prebooksAPI.catalog({ ...applied, page, limit });
      setItems(data.items || []); setTotal(Number(data.total || 0));
    } catch (e: any) { toast({ title: 'Could not load pre-book numbers', description: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [applied, page]);

  const loadMine = useCallback(async () => {
    if (!loggedIn) return;
    setMineLoading(true);
    try { setMine(await prebooksAPI.my()); }
    catch { setMine([]); }
    finally { setMineLoading(false); }
  }, [loggedIn]);

  useEffect(() => { loadCatalog(); }, [loadCatalog]);
  useEffect(() => { loadMine(); }, [loadMine]);
  useEffect(() => {
    Promise.all([categoriesAPI.list().catch(() => []), numbersAPI.operators().catch(() => [])]).then(([c, o]) => { setCategories(c || []); setOperators(o || []); });
    const timer = window.setInterval(() => setTick((v) => v + 1), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => { if (window.location.hash === '#mine') document.getElementById('mine')?.scrollIntoView({ behavior: 'smooth' }); }, [mineLoading]);

  const pages = Math.max(1, Math.ceil(total / limit));
  const reset = () => { setFilters(blankFilters); setApplied(blankFilters); setPage(1); };
  const cancel = async (record: PrebookRecord) => {
    if (!window.confirm(`Request a 100% refund for ${record.display_number}?`)) return;
    setBusy(record.prebook_id);
    try { await prebooksAPI.cancel(record.prebook_id, 'Cancellation requested within the 48-hour policy.'); toast({ title: 'Cancellation submitted', description: 'An admin will review the full refund.' }); await loadMine(); }
    catch (e: any) { toast({ title: 'Could not request cancellation', description: e.message, variant: 'destructive' }); }
    finally { setBusy(null); }
  };
  const reportIssue = async () => {
    if (!issue?.note.trim()) return;
    setBusy(issue.id);
    try { await prebooksAPI.reportIssue(issue.id, issue.type, issue.note); toast({ title: 'Issue reported', description: 'Your 100% refund request is awaiting admin review.' }); setIssue(null); await loadMine(); }
    catch (e: any) { toast({ title: 'Could not report issue', description: e.message, variant: 'destructive' }); }
    finally { setBusy(null); }
  };
  const adjustedMine = useMemo(() => mine.map((m) => ({ ...m, cancellation_seconds_remaining: Math.max(0, m.cancellation_seconds_remaining - tick * 60) })), [mine, tick]);

  return (
    <main className="mx-auto max-w-[1540px] px-4 py-8">
      <section className="overflow-hidden rounded-[1.75rem] border border-primary/20 bg-gradient-to-br from-card via-card to-primary/10 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-primary"><CalendarClock className="h-4 w-4" /> Exclusive pre-booking</span>
            <h1 className="mt-3 text-3xl font-black text-foreground sm:text-5xl">Reserve tomorrow’s VIP number today</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">Pay the full offer price to reserve one NON-RTP number exclusively. It becomes ready to port on the date shown, with a 48-hour cancellation window and 100% issue-refund guarantee.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-bold text-foreground sm:grid-cols-3">
            <span className="rounded-xl border border-border bg-background/70 px-3 py-2"><ShieldCheck className="mr-1 inline h-4 w-4 text-primary" /> Exclusive hold</span>
            <span className="rounded-xl border border-border bg-background/70 px-3 py-2"><Clock3 className="mr-1 inline h-4 w-4 text-primary" /> 48h cancellation</span>
            <span className="col-span-2 rounded-xl border border-border bg-background/70 px-3 py-2 sm:col-span-1">100% issue refund</span>
          </div>
        </div>
      </section>

      <form onSubmit={(e) => { e.preventDefault(); setApplied(filters); setPage(1); }} className="mt-5 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-black text-foreground"><Filter className="h-4 w-4 text-primary" /> Find a pre-book number</h2><button type="button" onClick={reset} className="inline-flex items-center gap-1 text-xs font-bold text-primary"><RotateCcw className="h-3.5 w-3.5" /> Reset</button></div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <label className="relative sm:col-span-2"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input aria-label="Search digits" inputMode="numeric" className="input-luxury h-10 w-full pl-9" placeholder="Search digits" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value.replace(/\D/g, '').slice(0, 10) })} /></label>
          <select aria-label="Category" className="input-luxury h-10" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}><option value="">All categories</option>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
          <select aria-label="Operator" className="input-luxury h-10" value={filters.operator} onChange={(e) => setFilters({ ...filters, operator: e.target.value })}><option value="">All operators</option>{operators.map((o) => <option key={o.operator} value={o.operator}>{o.operator} ({o.count})</option>)}</select>
          <input aria-label="Minimum price" type="number" className="input-luxury h-10" placeholder="Min price" value={filters.price_min} onChange={(e) => setFilters({ ...filters, price_min: e.target.value })} />
          <input aria-label="Maximum price" type="number" className="input-luxury h-10" placeholder="Max price" value={filters.price_max} onChange={(e) => setFilters({ ...filters, price_max: e.target.value })} />
          <input aria-label="RTP from" type="date" className="input-luxury h-10" value={filters.rtp_from} onChange={(e) => setFilters({ ...filters, rtp_from: e.target.value })} />
          <input aria-label="RTP to" type="date" className="input-luxury h-10" value={filters.rtp_to} onChange={(e) => setFilters({ ...filters, rtp_to: e.target.value })} />
          <select aria-label="Sort" className="input-luxury h-10 lg:col-span-2" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}><option value="rtp_soon">RTP date: soonest</option><option value="rtp_late">RTP date: latest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="newest">Newest</option></select>
          <button className="btn-gold h-10 lg:col-span-2">Apply filters</button>
        </div>
      </form>

      <div className="mt-5 flex items-center justify-between"><h2 className="text-xl font-black text-foreground">Available to pre-book</h2><span className="text-sm text-muted-foreground">{total} numbers</span></div>
      {loading ? <div className="py-16"><Loader /></div> : items.length ? <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.map((n) => <NumberCard key={n.number_id} item={n} />)}</div> : <EmptyState title="No matching pre-book numbers" subtitle="Try widening the date, price, or category filters." />}
      {pages > 1 && <div className="mt-6 flex items-center justify-center gap-3"><button aria-label="Previous page" className="btn-gold-outline h-10 px-3" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></button><span className="text-sm font-bold text-muted-foreground">Page {page} of {pages}</span><button aria-label="Next page" className="btn-gold-outline h-10 px-3" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></button></div>}

      <section id="mine" className="mt-12 scroll-mt-28">
        <div className="mb-4"><span className="text-xs font-black uppercase tracking-wider text-primary">Your reservations</span><h2 className="text-2xl font-black text-foreground">My Pre-booked Numbers</h2></div>
        {!loggedIn ? <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">Sign in to see your reserved numbers, cancellation countdowns, and refund progress.</div> : mineLoading ? <Loader /> : adjustedMine.length === 0 ? <EmptyState title="No pre-books yet" subtitle="Choose a NON-RTP number above to reserve it exclusively." /> : <div className="grid gap-3 lg:grid-cols-2">{adjustedMine.map((record) => <article key={record.prebook_id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3"><div><div className="text-xl font-black tracking-wider text-foreground">{record.display_number}</div><div className="mt-1 text-xs text-muted-foreground">{record.order_no} · {record.operator || 'Any operator'}</div></div><StatusBadge status={record.refund_status || record.status} /></div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm"><div className="rounded-xl bg-muted p-3"><div className="text-xs text-muted-foreground">Ready to port</div><b>{formatRtpDate(record.rtp_available_at)}</b></div><div className="rounded-xl bg-muted p-3"><div className="text-xs text-muted-foreground">Paid amount</div><b>{formatINR(record.total)}</b></div></div>
          {record.can_cancel && <p className="mt-3 text-xs font-bold text-primary"><Clock3 className="mr-1 inline h-3.5 w-3.5" />{countdown(record.cancellation_seconds_remaining)}</p>}
          {record.refund_status && <p className="mt-3 rounded-xl bg-primary/10 px-3 py-2 text-xs font-bold text-primary">Refund: {record.refund_status.replace(/_/g, ' ')}{record.reason_type ? ` · ${record.reason_type.replace(/_/g, ' ')}` : ''}</p>}
          <div className="mt-4 flex flex-wrap gap-2">{record.can_cancel && <button disabled={busy === record.prebook_id} onClick={() => cancel(record)} className="btn-gold-outline text-xs">Cancel & request refund</button>}{['BOOKED', 'READY'].includes(record.status) && !record.refund_status && <button onClick={() => setIssue({ id: record.prebook_id, type: 'DELIVERY_ISSUE', note: '' })} className="btn-gold-outline text-xs">Report an issue</button>}</div>
        </article>)}</div>}
      </section>

      {issue && <div className="fixed inset-0 z-[80] grid place-items-center bg-foreground/45 p-4" role="dialog" aria-modal="true" aria-labelledby="issue-title"><div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl"><h2 id="issue-title" className="text-xl font-black">Report a pre-book issue</h2><select className="input-luxury mt-4 w-full" value={issue.type} onChange={(e) => setIssue({ ...issue, type: e.target.value })}>{issueTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><textarea autoFocus className="input-luxury mt-3 w-full" rows={4} placeholder="Tell us what happened" value={issue.note} onChange={(e) => setIssue({ ...issue, note: e.target.value })} /><div className="mt-4 flex justify-end gap-2"><button onClick={() => setIssue(null)} className="btn-gold-outline">Close</button><button disabled={!issue.note.trim() || busy === issue.id} onClick={reportIssue} className="btn-gold">Submit issue</button></div></div></div>}
    </main>
  );
}
