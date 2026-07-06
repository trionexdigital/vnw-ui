import { useEffect, useState } from 'react';
import { Pencil, Trash2, Check, X, Plus, Star } from 'lucide-react';
import { adminAPI, categoriesAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, Loader, StatusBadge, Money, Table } from '@/shared/components/ui-bits';
import Modal from '@/shared/components/Modal';
import { badgeOptions, operatorOptions, statusOptions, numerologySum } from '@/core/lib/format';

const empty = { display_number: '', category_id: '', title_label: 'Business VIP Number', badge: 'NONE', mrp: '', offer_price: '', numerology_sum: '', operator: 'Airtel', description: '', stock: 1, status: 'AVAILABLE', is_featured: false };

export default function AdminNumbers() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);

  const load = () => { setLoading(true); adminAPI.numbersList({ status: statusFilter, limit: 60 }).then((d) => setItems(d.items || [])).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [statusFilter]);
  useEffect(() => { categoriesAPI.list().then(setCats).catch(() => {}); }, []);

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const input = 'w-full rounded-lg border border-card-border bg-secondary px-3 py-2 text-sm outline-none focus:border-primary';

  const openNew = () => { setForm(empty); setOpen(true); };
  const openEdit = (n: any) => { setForm({ ...n, category_id: n.category_id || '', is_featured: !!n.is_featured }); setOpen(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminAPI.numberSave({
        ...form, number_value: form.display_number.replace(/\s+/g, ''),
        category_id: form.category_id || null, mrp: Number(form.mrp), offer_price: Number(form.offer_price),
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

      <div className="mb-4 flex flex-wrap gap-2">
        {['ALL', ...statusOptions].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-full px-3 py-1 text-xs ${statusFilter === s ? 'btn-gold' : 'btn-gold-outline'}`}>{s.replace(/_/g, ' ')}</button>
        ))}
      </div>

      {loading ? <Loader /> : (
        <Table head={['Number', 'Category', 'Seller', 'MRP', 'Offer', 'Status', '']}>
          {items.map((n) => (
            <tr key={n.number_id} className="border-b border-card-border last:border-0">
              <td className="px-4 py-3 font-bold text-royal">{n.display_number} {n.is_featured ? <Star className="ml-1 inline h-3 w-3 text-primary" fill="currentColor" /> : null}</td>
              <td className="px-4 py-3 text-muted-foreground">{n.category_name || '—'}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{n.seller_type}</td>
              <td className="px-4 py-3"><Money value={n.mrp} /></td>
              <td className="px-4 py-3"><Money value={n.offer_price} /></td>
              <td className="px-4 py-3"><StatusBadge status={n.status} /></td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  {n.status === 'PENDING_APPROVAL' && (<>
                    <button title="Approve" onClick={() => act(adminAPI.numberApprove(n.number_id), 'Approved')} className="text-emerald-400 hover:text-emerald-300"><Check className="h-4 w-4" /></button>
                    <button title="Reject" onClick={() => act(adminAPI.numberReject(n.number_id), 'Rejected')} className="text-rose-400 hover:text-rose-300"><X className="h-4 w-4" /></button>
                  </>)}
                  <button onClick={() => openEdit(n)} className="text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => confirm('Delete?') && act(adminAPI.numberDelete(n.number_id), 'Deleted')} className="text-muted-foreground hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
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
          <select className={input} value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
            <option value="">Category</option>{cats.map((c) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
          </select>
          <input className={input} placeholder="Label" value={form.title_label} onChange={(e) => set('title_label', e.target.value)} />
          <select className={input} value={form.badge} onChange={(e) => set('badge', e.target.value)}>
            {badgeOptions.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
          <select className={input} value={form.operator} onChange={(e) => set('operator', e.target.value)}>
            {operatorOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <input type="number" className={input} placeholder="MRP" value={form.mrp} onChange={(e) => set('mrp', e.target.value)} required />
          <input type="number" className={input} placeholder="Offer Price" value={form.offer_price} onChange={(e) => set('offer_price', e.target.value)} required />
          <input type="number" className={input} placeholder="Numerology (auto)" value={form.numerology_sum} onChange={(e) => set('numerology_sum', e.target.value)} />
          <input type="number" className={input} placeholder="Stock" value={form.stock} onChange={(e) => set('stock', e.target.value)} />
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
