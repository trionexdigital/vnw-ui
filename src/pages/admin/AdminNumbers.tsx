import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pencil, Trash2, Check, X, Plus, Star, Sparkles } from 'lucide-react';
import { adminAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, Loader, StatusBadge, Money, Table } from '@/shared/components/ui-bits';
import Modal from '@/shared/components/Modal';
import { badgeOptions, statusOptions, numerologySum } from '@/core/lib/format';
import DetectedCategories from '@/shared/components/DetectedCategories';
import { getPrimaryCategory } from '@/core/categories/types';

const empty = { display_number: '', title_label: 'VIP Number', badge: 'NONE', mrp: '', offer_price: '', numerology_sum: '', operator: 'Any', description: '', stock: 1, status: 'AVAILABLE', is_featured: false };

const categoryLabel = (number: any) => getPrimaryCategory(number)?.name || 'Unique';

export default function AdminNumbers() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);

  const load = () => { setLoading(true); adminAPI.numbersList({ status: statusFilter, limit: 60 }).then((d) => setItems(d.items || [])).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [statusFilter]);

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const input = 'w-full rounded-lg border border-card-border bg-secondary px-3 py-2 text-sm outline-none focus:border-primary';

  const openNew = () => { setForm(empty); setOpen(true); };
  const openEdit = (n: any) => { setForm({ ...n, is_featured: !!n.is_featured }); setOpen(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminAPI.numberSave({
        ...form, number_value: form.display_number.replace(/\s+/g, ''),
        mrp: Number(form.mrp), offer_price: Number(form.offer_price),
        numerology_sum: form.numerology_sum || numerologySum(form.display_number),
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

      {loading ? <Loader /> : (
        <Table head={['Number', 'Category', 'Seller', 'MRP', 'Offer', 'Status', '']}>
          {items.map((n) => (
            <tr key={n.number_id} className="border-b border-card-border last:border-0">
              <td className="px-4 py-3 font-bold text-foreground">{n.display_number} {n.is_featured ? <Star className="ml-1 inline h-3 w-3 text-primary" fill="currentColor" /> : null}</td>
              <td className="px-4 py-3 text-muted-foreground">{categoryLabel(n)}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{n.seller_type}</td>
              <td className="px-4 py-3"><Money value={n.mrp} /></td>
              <td className="px-4 py-3"><Money value={n.offer_price} /></td>
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
          <input type="number" className={input} placeholder="MRP" value={form.mrp} onChange={(e) => set('mrp', e.target.value)} required />
          <input type="number" className={input} placeholder="Offer Price" value={form.offer_price} onChange={(e) => set('offer_price', e.target.value)} required />
          <input type="number" className={input} placeholder="Numerology (auto)" value={form.numerology_sum} onChange={(e) => set('numerology_sum', e.target.value)} />
          <select className={input} value={form.status} onChange={(e) => set('status', e.target.value)}>
            {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={form.is_featured} onChange={(e) => set('is_featured', e.target.checked)} /> Featured on homepage</label>
          <textarea className={input + ' sm:col-span-2'} rows={2} placeholder="Description" value={form.description || ''} onChange={(e) => set('description', e.target.value)} />
          <div className="sm:col-span-2"><button className="btn-gold w-full">Save Number</button></div>
        </form>
      </Modal>
    </div>
  );
}
