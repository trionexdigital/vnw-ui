import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, Trash2, ArrowLeft } from 'lucide-react';
import { adminAPI } from '@/core/api/vnwAPI';
import { Loader, Money, StatusBadge, Table } from '@/shared/components/ui-bits';
import Modal from '@/shared/components/Modal';
import { getPrimaryCategory } from '@/core/categories/types';

export default function AdminNumberRecycle() {
  const loadId = useRef(0);
  const [items, setItems] = useState<any[]>([]), [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(1), [pageSize, setPageSize] = useState(25), [total, setTotal] = useState(0);
  const [q, setQ] = useState(''), [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [action, setAction] = useState<'restore' | 'permanent' | null>(null), [notice, setNotice] = useState('');
  const load = async () => {
    const request = ++loadId.current; setLoading(true); setError(''); setSelected([]);
    try { const d = await adminAPI.recycledNumbersList({ page, limit: pageSize, q: search }); if(request !== loadId.current) return; if(page > Math.max(1, Math.ceil(Number(d.total || 0) / pageSize))) setPage(Math.max(1, Math.ceil(Number(d.total || 0) / pageSize))); setItems(d.items || []); setTotal(Number(d.total || 0)); }
    catch (e: any) { if(request === loadId.current) setError(e.message); }
    finally { if(request === loadId.current) setLoading(false); }
  };
  useEffect(() => { void load(); }, [page, pageSize, search]);
  const chosen = items.filter((n) => selected.includes(n.number_id));
  const canPurge = chosen.length > 0 && chosen.every((n) => n.can_permanently_delete);
  const change = async () => {
    setBusy(true); setError('');
    try { if (action === 'permanent') await adminAPI.permanentlyDeleteNumbers(selected); else await adminAPI.restoreNumbers(selected); setNotice(`${selected.length} numbers ${action === 'permanent' ? 'permanently deleted' : 'restored'}.`); setAction(null); await load(); }
    catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  };
  return <div>
    <div className="mb-4 flex flex-wrap items-center gap-2"><Link to="/admin/numbers" className="btn-gold-outline min-h-9 px-3 text-xs"><ArrowLeft className="h-4 w-4" /> Numbers</Link><h1 className="text-xl font-black">Recycle</h1></div>
    <p className="mb-3 text-sm text-muted-foreground">Restore deleted inventory or permanently remove eligible numbers. Numbers with order, pre-book or dealer purchase history remain protected.</p>
    <form onSubmit={(e) => { e.preventDefault(); setSearch(q); setPage(1); }} className="mb-3 flex flex-wrap gap-2"><input aria-label="Search recycled numbers" value={q} onChange={(e) => setQ(e.target.value)} className="input-premium min-w-0 flex-1" placeholder="Search mobile number" /><button className="btn-gold-outline">Search</button></form>
    <div className="mb-3 flex flex-wrap gap-2"><button disabled={loading || busy || !items.length} onClick={() => setSelected(items.map((n) => n.number_id))} className="btn-gold-outline min-h-9 px-3 text-xs">Select all on this page</button><button disabled={!selected.length || busy} onClick={() => setSelected([])} className="btn-gold-outline min-h-9 px-3 text-xs">Deselect all</button><span className="self-center text-sm">{selected.length} selected</span><button disabled={!selected.length || busy} onClick={() => setAction('restore')} className="btn-gold min-h-9 px-3 text-xs"><RotateCcw className="h-4 w-4" /> Restore selected</button><button disabled={!canPurge || busy} onClick={() => setAction('permanent')} className="btn-gold-outline min-h-9 px-3 text-xs"><Trash2 className="h-4 w-4" /> Permanently delete selected</button></div>
    {notice && <p role="status" className="mb-3 rounded-xl bg-success/10 p-3 text-sm">{notice}</p>}
    {error && <p role="alert" className="mb-3 text-sm text-destructive">{error}</p>}
    {loading ? <Loader /> : <Table head={['Select', 'Number', 'Category', 'Visibility', 'MRP', 'Discounted price', 'Readiness', 'Previous status', 'Deleted', 'Permanent deletion']} pagination={{ page, pageSize, total, onPageChange: setPage, onPageSizeChange: (size) => { setPageSize(size); setPage(1); } }}>
      {items.map((n) => <tr key={n.number_id} className="border-b border-card-border last:border-0"><td className="px-4 py-3"><input type="checkbox" aria-label={`Select ${n.number_value}`} checked={selected.includes(n.number_id)} onChange={(e) => setSelected((ids) => e.target.checked ? [...ids, n.number_id] : ids.filter((id) => id !== n.number_id))} /></td><td className="px-4 py-3 font-bold">{n.display_number}</td><td className="px-4 py-3">{getPrimaryCategory(n)?.name || 'Unique'}</td><td className="px-4 py-3"><StatusBadge status={n.visibility_type || 'ONLINE'} /></td><td className="px-4 py-3"><Money value={n.mrp} /></td><td className="px-4 py-3"><Money value={n.offer_price} /></td><td className="px-4 py-3">{n.rtp_status}</td><td className="px-4 py-3"><StatusBadge status={n.status_before_delete || 'INACTIVE'} /></td><td className="px-4 py-3 text-xs">{new Date(n.deleted_at.endsWith('Z') ? n.deleted_at : `${n.deleted_at}Z`).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td><td className="px-4 py-3 text-xs">{n.can_permanently_delete ? 'Eligible' : n.permanent_delete_reason}</td></tr>)}
    </Table>}
    {action && <Modal open onClose={() => { if (!busy) setAction(null); }} title={action === 'permanent' ? 'Confirm permanent deletion' : 'Restore selected numbers'}>
      <p className="text-sm">{action === 'permanent' ? 'These numbers will be permanently deleted. This cannot be undone.' : 'These numbers will return to inventory with their previous status and stock.'}</p><ul className="my-4 max-h-48 overflow-y-auto text-sm font-bold">{chosen.map((n) => <li key={n.number_id}>{n.display_number}</li>)}</ul><button disabled={busy} onClick={change} className="btn-gold">{busy ? 'Saving…' : action === 'permanent' ? 'Permanently delete' : 'Confirm restore'}</button>{error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    </Modal>}
  </div>;
}
