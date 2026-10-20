import { ThemedSelect } from '@/shared/ui/themed-select';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Pencil, Trash2, Check, X, Plus, Star, Sparkles, CalendarClock, Download, Upload } from 'lucide-react';
import { adminAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { Loader, StatusBadge, Money, Table } from '@/shared/components/ui-bits';
import Modal from '@/shared/components/Modal';
import { statusOptions } from '@/core/lib/format';
import NumberDeleteDialog from './NumberDeleteDialog';
import NumberEditor from './NumberEditor';
import NumberImportDialog, { downloadNumberWorkbook } from './NumberImportDialog';
import { getPrimaryCategory } from '@/core/categories/types';

const empty = { display_number: '', title_label: '', badge: 'NONE', base_price: '', description: '', status: 'AVAILABLE', visibility_type: '', is_featured: false, rtp_status: '', serviceable_pin_codes: [] as string[], rtp_available_date: '' };

const toIstDateInput = (value?: string | null) => value
  ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value.endsWith('Z') ? value : `${value}Z`))
  : '';

const categoryLabel = (number: any) => getPrimaryCategory(number)?.name || 'Unique';

export default function AdminNumbers() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [visibilityFilter, setVisibilityFilter] = useState('ALL');
  const [readinessFilter, setReadinessFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState<Map<number, string>>(() => new Map());
  const allOnPage = items.length > 0 && items.every(n => selected.has(n.number_id));
  const someOnPage = items.some(n => selected.has(n.number_id));
  const toggleNumber = (n: any) => setSelected(current => {
    const next = new Map(current);
    if (next.has(n.number_id)) next.delete(n.number_id);
    else if (next.size < 1000) next.set(n.number_id, n.number_value);
    return next;
  });
  const togglePage = () => setSelected(current => {
    const next = new Map(current);
    items.forEach(n => { if (allOnPage) next.delete(n.number_id); else if (next.size < 1000) next.set(n.number_id, n.number_value); });
    return next;
  });

  const load = () => { setLoading(true); adminAPI.numbersList({ status: statusFilter, visibility_type: visibilityFilter === 'ALL' ? undefined : visibilityFilter, rtp_status: readinessFilter === 'ALL' ? undefined : readinessFilter, page, limit: pageSize }).then((d) => { setItems(d.items || []); const count = Number(d.total || 0); setTotal(count); const lastPage = Math.max(1, Math.ceil(count / pageSize)); if (page > lastPage) setPage(lastPage); }).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [statusFilter, visibilityFilter, readinessFilter, page, pageSize]);
  useEffect(() => { setSelected(new Map()); }, [statusFilter, visibilityFilter, readinessFilter]);

  const openNew = () => { setForm(empty); setOpen(true); };
  const openEdit = (n: any) => { setForm({ ...n, visibility_type: n.visibility_type || 'ONLINE', private_link_ids: n.private_link_ids || [], is_featured: !!n.is_featured, rtp_status: n.rtp_status || 'RTP', rtp_available_date: toIstDateInput(n.rtp_available_at) }); setOpen(true); };

  const act = async (fn: Promise<any>, msg: string) => { try { await fn; toast({ title: msg }); load(); } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); } };

  return (
    <div>

      {searchParams.get('notice') === 'automatic-categories' && (
        <div role="status" className="mb-4 flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-foreground">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span><strong>The category is detected automatically.</strong> Enter or edit a mobile number to preview its strongest matching pattern.</span>
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ThemedSelect aria-label="Filter number status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="h-9 w-48"><option value="ALL">All statuses</option>{statusOptions.map((status) => <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>)}</ThemedSelect>
        <ThemedSelect aria-label="Filter number visibility" value={visibilityFilter} onChange={(event) => { setVisibilityFilter(event.target.value); setPage(1); }} className="h-9 w-40"><option value="ALL">All visibility</option><option value="ONLINE">Online</option><option value="OFFLINE">Offline</option></ThemedSelect>
        <ThemedSelect aria-label="Filter RTP status" value={readinessFilter} onChange={(event) => { setReadinessFilter(event.target.value); setPage(1); }} className="h-9 w-40"><option value="ALL">All RTP statuses</option><option value="RTP">RTP</option><option value="NON_RTP">NON-RTP</option><option value="RTA">RTA</option></ThemedSelect>
        {!loading && items.length > 0 && <label className="flex items-center gap-2 text-xs font-bold md:hidden"><input type="checkbox" aria-label="Select all numbers on this page" checked={allOnPage} ref={el => { if (el) el.indeterminate = someOnPage && !allOnPage; }} onChange={togglePage} className="h-4 w-4 accent-primary" />Select page</label>}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {selected.size > 0 && <><span role="status" className="text-xs font-bold text-muted-foreground">{selected.size} selected</span><button type="button" onClick={() => setSelected(new Map())} className="text-xs font-bold text-primary">Clear selection</button></>}
          <button onClick={() => setDeleteInput([...selected.values()].join('\n'))} className="btn-gold-outline min-h-9 px-3 text-xs"><Trash2 className="h-4 w-4" />{selected.size ? `Delete selected (${selected.size})` : 'Delete'}</button>
          <Link to="/admin/numbers/recycle" className="btn-gold-outline min-h-9 px-3 text-xs">Recycle</Link>
          <button onClick={() => setImportOpen(true)} className="btn-gold-outline min-h-9 px-3 text-xs"><Upload className="h-4 w-4" /> Import</button>
          <button disabled={exporting} onClick={async () => { setExporting(true); try { downloadNumberWorkbook(await adminAPI.numbersExport({ status: statusFilter, visibility_type: visibilityFilter === 'ALL' ? undefined : visibilityFilter, rtp_status: readinessFilter === 'ALL' ? undefined : readinessFilter })); } catch (error: any) { toast({ title: 'Export failed', description: error.message, variant: 'destructive' }); } finally { setExporting(false); } }} className="btn-gold-outline min-h-9 px-3 text-xs"><Download className="h-4 w-4" />{exporting ? 'Exporting…' : 'Export'}</button>
          <button onClick={openNew} className="btn-gold min-h-9 px-3 text-xs"><Plus className="h-4 w-4" /> Add Number</button>
        </div>
      </div>

      {loading ? <Loader /> : (
        <Table head={['Select', 'Number', 'Category', 'Visibility', 'MRP', 'Discounted price', 'Readiness', 'Status', '']} headerContent={{ Select: <input type="checkbox" aria-label="Select all numbers on this page" title="Select up to 1,000 records" checked={allOnPage} ref={el => { if (el) el.indeterminate = someOnPage && !allOnPage; }} onChange={togglePage} className="hidden h-4 w-4 accent-primary md:block" /> }} pagination={{ page, pageSize, total, onPageChange: setPage, onPageSizeChange: (size) => { setPageSize(size); setPage(1); } }}>
          {items.map((n) => (
            <tr key={n.number_id} data-selected={selected.has(n.number_id)} className="border-b border-card-border last:border-0 data-[selected=true]:bg-primary/5">
              <td className="px-4 py-3"><input type="checkbox" aria-label={`Select ${n.number_value}`} checked={selected.has(n.number_id)} disabled={!selected.has(n.number_id) && selected.size >= 1000} onChange={() => toggleNumber(n)} className="h-4 w-4 accent-primary" /></td>
              <td className="px-4 py-3 font-bold text-foreground">{n.display_number} {n.is_featured ? <Star className="ml-1 inline h-3 w-3 text-primary" fill="currentColor" /> : null}</td>
              <td className="px-4 py-3 text-muted-foreground">{categoryLabel(n)}</td>
              <td className="px-4 py-3"><StatusBadge status={n.visibility_type || 'ONLINE'} /></td>
              <td className="px-4 py-3"><Money value={n.mrp} /></td>
              <td className="px-4 py-3"><Money value={n.offer_price} /></td>
              <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black ${n.rtp_status === 'NON_RTP' ? 'bg-amber-500/15 text-amber-700' : n.rtp_status === 'RTA' ? 'bg-success/10 text-success' : 'bg-blue-500/10 text-blue-700'}`}><CalendarClock className="h-3 w-3" />{n.rtp_status === 'NON_RTP' ? 'NON-RTP · PRE-BOOK' : n.rtp_status === 'RTA' ? 'RTA · ACTIVATE' : 'RTP · PORT'}{n.rtp_status === 'NON_RTP' && n.rtp_available_at ? ` · ${toIstDateInput(n.rtp_available_at)}` : ''}</span>{n.rtp_status === 'RTA' && <div className="mt-1 text-xs text-muted-foreground">{n.serviceable_pin_codes?.length ? n.serviceable_pin_codes.join(', ') : 'PIN codes not assigned'}</div>}</td>
              <td className="px-4 py-3"><StatusBadge status={n.status} /></td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  {n.status === 'PENDING_APPROVAL' && (<>
                    <button title="Approve" onClick={() => act(adminAPI.numberApprove(n.number_id), 'Approved')} className="text-success hover:text-success/80"><Check className="h-4 w-4" /></button>
                    <button title="Reject" onClick={() => act(adminAPI.numberReject(n.number_id), 'Rejected')} className="text-destructive hover:text-destructive/80"><X className="h-4 w-4" /></button>
                  </>)}
                  <button onClick={() => openEdit(n)} className="text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
                  <button title="Move to Recycle" onClick={() => setDeleteInput(n.number_value)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={form.number_id ? 'Edit Number' : 'Add Numbers'} wide>
        <NumberEditor key={form.number_id || 'new'} initial={form} onChanged={load} onSaved={(message) => { toast({ title: message }); setOpen(false); load(); }} />
      </Modal>
      {deleteInput !== null && <NumberDeleteDialog initial={deleteInput} onClose={() => setDeleteInput(null)} onSaved={() => { setSelected(new Map()); load(); }} />}
      {importOpen && <NumberImportDialog open onClose={() => setImportOpen(false)} onSaved={load} />}
    </div>
  );
}
