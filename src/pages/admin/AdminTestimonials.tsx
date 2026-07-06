import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus, Star } from 'lucide-react';
import { adminAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, Loader, Table } from '@/shared/components/ui-bits';
import Modal from '@/shared/components/Modal';

const empty = { name: '', role: '', content: '', rating: 5, is_active: true, sort_order: 0 };

export default function AdminTestimonials() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);

  const load = () => { setLoading(true); adminAPI.testimonialsList().then(setItems).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const input = 'w-full rounded-lg border border-card-border bg-secondary px-3 py-2 text-sm outline-none focus:border-primary';

  const save = async (e: React.FormEvent) => { e.preventDefault(); try { await adminAPI.testimonialSave(form); toast({ title: 'Saved' }); setOpen(false); load(); } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); } };
  const del = async (id: number) => { if (!confirm('Delete?')) return; await adminAPI.testimonialDelete(id); load(); };

  return (
    <div>
      <PageHeader title="Testimonials" subtitle="Manage landing-page testimonials"
        action={<button onClick={() => { setForm(empty); setOpen(true); }} className="btn-gold text-sm"><Plus className="h-4 w-4" /> Add</button>} />
      {loading ? <Loader /> : (
        <Table head={['Name', 'Role', 'Content', 'Rating', 'Active', '']}>
          {items.map((t) => (
            <tr key={t.testimonial_id} className="border-b border-card-border last:border-0">
              <td className="px-4 py-3 text-foreground">{t.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{t.role}</td>
              <td className="px-4 py-3 max-w-md text-muted-foreground">{t.content}</td>
              <td className="px-4 py-3"><span className="flex gap-0.5 text-primary">{Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="h-3 w-3" fill="currentColor" />)}</span></td>
              <td className="px-4 py-3">{t.is_active ? '✓' : '—'}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setForm({ ...t, is_active: !!t.is_active }); setOpen(true); }} className="text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => del(t.testimonial_id)} className="text-muted-foreground hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title={form.testimonial_id ? 'Edit Testimonial' : 'Add Testimonial'}>
        <form onSubmit={save} className="space-y-3">
          <input required className={input} placeholder="Name" value={form.name} onChange={(e) => set('name', e.target.value)} />
          <input className={input} placeholder="Role (e.g. Business Owner)" value={form.role || ''} onChange={(e) => set('role', e.target.value)} />
          <textarea required rows={3} className={input} placeholder="Testimonial content" value={form.content} onChange={(e) => set('content', e.target.value)} />
          <div className="flex items-center gap-3">
            <input type="number" min={1} max={5} className={input} placeholder="Rating" value={form.rating} onChange={(e) => set('rating', e.target.value)} />
            <input type="number" className={input} placeholder="Sort order" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} /> Active</label>
          <button className="btn-gold w-full">Save</button>
        </form>
      </Modal>
    </div>
  );
}
