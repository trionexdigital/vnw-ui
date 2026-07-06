import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { adminAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, Loader, Table } from '@/shared/components/ui-bits';
import Modal from '@/shared/components/Modal';

const empty = { title: '', subtitle: '', cta_text: '', cta_link: '', is_active: true, sort_order: 0 };

export default function AdminBanners() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);

  const load = () => { setLoading(true); adminAPI.bannersList().then(setItems).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const input = 'w-full rounded-lg border border-card-border bg-secondary px-3 py-2 text-sm outline-none focus:border-primary';

  const save = async (e: React.FormEvent) => { e.preventDefault(); try { await adminAPI.bannerSave(form); toast({ title: 'Saved' }); setOpen(false); load(); } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); } };
  const del = async (id: number) => { if (!confirm('Delete?')) return; await adminAPI.bannerDelete(id); load(); };

  return (
    <div>
      <PageHeader title="Banners" subtitle="Hero & promo banners on the storefront"
        action={<button onClick={() => { setForm(empty); setOpen(true); }} className="btn-gold text-sm"><Plus className="h-4 w-4" /> Add Banner</button>} />
      {loading ? <Loader /> : (
        <Table head={['Title', 'Subtitle', 'CTA', 'Active', '']}>
          {items.map((b) => (
            <tr key={b.banner_id} className="border-b border-card-border last:border-0">
              <td className="px-4 py-3 text-foreground">{b.title}</td>
              <td className="px-4 py-3 max-w-sm text-muted-foreground">{b.subtitle}</td>
              <td className="px-4 py-3 text-muted-foreground">{b.cta_text} → {b.cta_link}</td>
              <td className="px-4 py-3">{b.is_active ? '✓' : '—'}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setForm({ ...b, is_active: !!b.is_active }); setOpen(true); }} className="text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => del(b.banner_id)} className="text-muted-foreground hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title={form.banner_id ? 'Edit Banner' : 'Add Banner'}>
        <form onSubmit={save} className="space-y-3">
          <input required className={input} placeholder="Title" value={form.title} onChange={(e) => set('title', e.target.value)} />
          <input className={input} placeholder="Subtitle" value={form.subtitle || ''} onChange={(e) => set('subtitle', e.target.value)} />
          <input className={input} placeholder="CTA text (e.g. Explore Numbers)" value={form.cta_text || ''} onChange={(e) => set('cta_text', e.target.value)} />
          <input className={input} placeholder="CTA link (e.g. /shop)" value={form.cta_link || ''} onChange={(e) => set('cta_link', e.target.value)} />
          <input type="number" className={input} placeholder="Sort order" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} /> Active</label>
          <button className="btn-gold w-full">Save</button>
        </form>
      </Modal>
    </div>
  );
}
