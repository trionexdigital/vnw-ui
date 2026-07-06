import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { adminAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, Loader, Table, Money, StatusBadge } from '@/shared/components/ui-bits';
import Modal from '@/shared/components/Modal';

const empty = { code: '', type: 'PERCENT', value: '', min_order: '', max_discount: '', usage_limit: '', expires_at: '', is_active: true };

export default function AdminCoupons() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);

  const load = () => { setLoading(true); adminAPI.couponsList().then(setItems).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const input = 'w-full rounded-lg border border-card-border bg-secondary px-3 py-2 text-sm outline-none focus:border-gold';

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await adminAPI.couponSave(form); toast({ title: 'Coupon saved' }); setOpen(false); load(); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };
  const del = async (id: number) => { if (!confirm('Delete coupon?')) return; await adminAPI.couponDelete(id); load(); };

  return (
    <div>
      <PageHeader title="Coupons & Offers" subtitle="Create discount codes to drive more sales"
        action={<button onClick={() => { setForm(empty); setOpen(true); }} className="btn-gold text-sm"><Plus className="h-4 w-4" /> Add Coupon</button>} />
      {loading ? <Loader /> : (
        <Table head={['Code', 'Type', 'Value', 'Min Order', 'Used', 'Active', '']}>
          {items.map((c) => (
            <tr key={c.coupon_id} className="border-b border-card-border last:border-0">
              <td className="px-4 py-3 font-bold text-royal">{c.code}</td>
              <td className="px-4 py-3 text-muted-foreground">{c.type}</td>
              <td className="px-4 py-3 text-royal">{c.type === 'PERCENT' ? `${c.value}%` : <Money value={c.value} />}</td>
              <td className="px-4 py-3"><Money value={c.min_order} /></td>
              <td className="px-4 py-3 text-muted-foreground">{c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ''}</td>
              <td className="px-4 py-3"><StatusBadge status={c.is_active ? 'ACTIVE' : 'INACTIVE'} /></td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setForm({ ...c, is_active: !!c.is_active, expires_at: c.expires_at ? String(c.expires_at).slice(0, 10) : '' }); setOpen(true); }} className="text-muted-foreground hover:text-gold-dark"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => del(c.coupon_id)} className="text-muted-foreground hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title={form.coupon_id ? 'Edit Coupon' : 'Add Coupon'}>
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <input required className={input + ' sm:col-span-2 uppercase'} placeholder="CODE (e.g. WELCOME10)" value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} />
          <select className={input} value={form.type} onChange={(e) => set('type', e.target.value)}><option value="PERCENT">Percent %</option><option value="FLAT">Flat ₹</option></select>
          <input required type="number" className={input} placeholder="Value" value={form.value} onChange={(e) => set('value', e.target.value)} />
          <input type="number" className={input} placeholder="Min order ₹" value={form.min_order} onChange={(e) => set('min_order', e.target.value)} />
          <input type="number" className={input} placeholder="Max discount ₹ (optional)" value={form.max_discount} onChange={(e) => set('max_discount', e.target.value)} />
          <input type="number" className={input} placeholder="Usage limit (optional)" value={form.usage_limit} onChange={(e) => set('usage_limit', e.target.value)} />
          <input type="date" className={input} value={form.expires_at} onChange={(e) => set('expires_at', e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-muted-foreground sm:col-span-2"><input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} /> Active</label>
          <div className="sm:col-span-2"><button className="btn-gold w-full">Save Coupon</button></div>
        </form>
      </Modal>
    </div>
  );
}
