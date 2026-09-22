import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pencil, Trash2, Check, X, Plus, Star, Sparkles, CalendarClock } from 'lucide-react';
import { adminAPI, type PrivateCollection } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, Loader, StatusBadge, Money, Table } from '@/shared/components/ui-bits';
import Modal from '@/shared/components/Modal';
import { badgeOptions, statusOptions, numerologySum } from '@/core/lib/format';
import DetectedCategories from '@/shared/components/DetectedCategories';
import { getPrimaryCategory } from '@/core/categories/types';

const empty = { display_number: '', title_label: 'VIP Number', badge: 'NONE', mrp: '', numerology_sum: '', description: '', stock: 1, status: 'AVAILABLE', visibility_type: 'ONLINE', private_link_ids: [] as number[], is_featured: false, rtp_status: 'RTA', rtp_available_date: '' };

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
  const [privateLinks, setPrivateLinks] = useState<PrivateCollection[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);

  const load = () => { setLoading(true); adminAPI.numbersList({ status: statusFilter, visibility_type: visibilityFilter === 'ALL' ? undefined : visibilityFilter, limit: 60 }).then((d) => setItems(d.items || [])).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [statusFilter, visibilityFilter]);
  useEffect(() => { adminAPI.privateLinksList().then(setPrivateLinks).catch(() => setPrivateLinks([])); }, []);

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const input = 'w-full rounded-lg border border-card-border bg-secondary px-3 py-2 text-sm outline-none focus:border-primary';

  const openNew = () => { setForm(empty); setOpen(true); };
  const openEdit = (n: any) => { setForm({ ...n, visibility_type: n.visibility_type || 'ONLINE', private_link_ids: n.private_link_ids || [], is_featured: !!n.is_featured, rtp_status: n.rtp_status || 'RTP', rtp_available_date: toIstDateInput(n.rtp_available_at) }); setOpen(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminAPI.numberSave({
        ...form, number_value: form.display_number.replace(/\s+/g, ''),
        mrp: Number(form.mrp),
        numerology_sum: form.numerology_sum || numerologySum(form.display_number),
        rtp_available_date: form.rtp_status === 'NON_RTP' ? form.rtp_available_date : null,
      });
      toast({ title: 'Saved' }); setOpen(false); load();
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };
  const act = async (fn: Promise<any>, msg: string) => { try { await fn; toast({ title: msg }); load(); } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); } };

  return (
    <div>
      <PageHeader title="Numbers" subtitle="Manage the VIP number catalog"
        action={<button onClick={openNew} className="btn-gold text-sm"><Plus className="h-4 w-4" /> Add Number</button>} />

      {searchParams.get('notice') === 'automatic-categories' && (
        <div role="status" className="mb-4 flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-foreground">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span><strong>The category is detected automatically.</strong> Enter or edit a mobile number to preview its strongest matching pattern.</span>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {['ALL', ...statusOptions].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-full px-3 py-1 text-xs ${statusFilter === s ? 'btn-gold' : 'btn-gold-outline'}`}>{s.replace(/_/g, ' ')}</button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {['ALL', 'ONLINE', 'OFFLINE'].map((visibility) => <button key={visibility} onClick={() => setVisibilityFilter(visibility)} className={`rounded-full px-3 py-1 text-xs font-black ${visibilityFilter === visibility ? 'btn-gold' : 'btn-gold-outline'}`}>{visibility === 'ALL' ? 'All visibility' : visibility}</button>)}
      </div>

      {loading ? <Loader /> : (
        <Table head={['Number', 'Category', 'Visibility', 'MRP', 'Discounted price', 'Readiness', 'Status', '']}>
          {items.map((n) => (
            <tr key={n.number_id} className="border-b border-card-border last:border-0">
              <td className="px-4 py-3 font-bold text-foreground">{n.display_number} {n.is_featured ? <Star className="ml-1 inline h-3 w-3 text-primary" fill="currentColor" /> : null}</td>
              <td className="px-4 py-3 text-muted-foreground">{categoryLabel(n)}</td>
              <td className="px-4 py-3"><StatusBadge status={n.visibility_type || 'ONLINE'} /></td>
              <td className="px-4 py-3"><Money value={n.mrp} /></td>
              <td className="px-4 py-3"><Money value={n.offer_price} /></td>
              <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black ${n.rtp_status === 'NON_RTP' ? 'bg-amber-500/15 text-amber-700' : n.rtp_status === 'RTA' ? 'bg-success/10 text-success' : 'bg-blue-500/10 text-blue-700'}`}><CalendarClock className="h-3 w-3" />{n.rtp_status === 'NON_RTP' ? 'NON-RTP · PRE-BOOK' : n.rtp_status === 'RTA' ? 'RTA · ACTIVATE' : 'RTP · PORT'}{n.rtp_status === 'NON_RTP' && n.rtp_available_at ? ` · ${toIstDateInput(n.rtp_available_at)}` : ''}</span></td>
              <td className="px-4 py-3"><StatusBadge status={n.status} /></td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  {n.status === 'PENDING_APPROVAL' && (<>
                    <button title="Approve" onClick={() => act(adminAPI.numberApprove(n.number_id), 'Approved')} className="text-success hover:text-success/80"><Check className="h-4 w-4" /></button>
                    <button title="Reject" onClick={() => act(adminAPI.numberReject(n.number_id), 'Rejected')} className="text-destructive hover:text-destructive/80"><X className="h-4 w-4" /></button>
                  </>)}
                  <button onClick={() => openEdit(n)} className="text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => confirm('Delete?') && act(adminAPI.numberDelete(n.number_id), 'Deleted')} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={form.number_id ? 'Edit Number' : 'Add Number'} wide>
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="mb-1 block text-xs text-muted-foreground">Number (with spaces)</label>
            <input required className={input} value={form.display_number} onChange={(e) => set('display_number', e.target.value)} /></div>
          <DetectedCategories number={form.display_number} className="sm:col-span-2" />
          <input className={input} placeholder="Label" value={form.title_label} onChange={(e) => set('title_label', e.target.value)} />
          <select className={input} value={form.badge} onChange={(e) => set('badge', e.target.value)}>
            {badgeOptions.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
          <div><label className="mb-1 block text-xs font-bold text-muted-foreground">MRP</label><input type="number" min="1" className={input} placeholder="MRP" value={form.mrp} onChange={(e) => set('mrp', e.target.value)} required /><p className="mt-1 text-[11px] text-muted-foreground">The discounted storefront price is calculated from Settings.</p></div>
          <input type="number" className={input} placeholder="Numerology (auto)" value={form.numerology_sum} onChange={(e) => set('numerology_sum', e.target.value)} />
          <select className={input} value={form.status} onChange={(e) => set('status', e.target.value)}>
            {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div><label className="mb-1 block text-xs font-bold text-muted-foreground">Stock Visibility</label><select className={input} value={form.visibility_type || 'ONLINE'} onChange={(e) => { set('visibility_type', e.target.value); if (e.target.value === 'ONLINE') set('private_link_ids', []); }}><option value="ONLINE">Online · Publicly available</option><option value="OFFLINE">Offline · Private link only</option></select></div>
          <div>
            <label className="mb-1 block text-xs font-bold text-muted-foreground">Porting / activation readiness</label>
            <select className={input} value={form.rtp_status || 'RTA'} onChange={(e) => { set('rtp_status', e.target.value); if (e.target.value !== 'NON_RTP') set('rtp_available_date', ''); }}>
              <option value="RTP">RTP · Ready to port</option>
              <option value="NON_RTP">NON-RTP · Pre-book until RTP date</option>
              <option value="RTA">RTA · Ready to activate within minutes</option>
            </select>
          </div>
          {form.visibility_type === 'OFFLINE' && <fieldset className="rounded-xl border border-border p-3 sm:col-span-2"><legend className="px-2 text-xs font-black text-muted-foreground">Private collection assignment</legend><div className="grid gap-2 sm:grid-cols-2">{privateLinks.filter((link) => !link.revoked_at).map((link) => <label key={link.private_link_id} className="flex items-center gap-2 rounded-lg bg-muted p-2 text-sm font-bold"><input type="checkbox" checked={(form.private_link_ids || []).includes(link.private_link_id)} onChange={(e) => set('private_link_ids', e.target.checked ? [...(form.private_link_ids || []),link.private_link_id] : (form.private_link_ids || []).filter((id: number) => id !== link.private_link_id))} />{link.name}</label>)}</div>{!privateLinks.length && <p className="text-xs text-destructive">Create a Private Link collection before saving an Offline number.</p>}</fieldset>}
          {form.rtp_status === 'NON_RTP' && <div>
            <label className="mb-1 block text-xs font-bold text-muted-foreground">Ready-to-port date (India)</label>
            <input type="date" className={input} required min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)} value={form.rtp_available_date || ''} onChange={(e) => set('rtp_available_date', e.target.value)} />
          </div>}
          <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={form.is_featured} onChange={(e) => set('is_featured', e.target.checked)} /> Catalog premium attribute</label>
          <textarea className={input + ' sm:col-span-2'} rows={2} placeholder="Description" value={form.description || ''} onChange={(e) => set('description', e.target.value)} />
          <div className="sm:col-span-2"><button className="btn-gold w-full">Save Number</button></div>
        </form>
      </Modal>
    </div>
  );
}
