import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { adminAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, Loader, Table } from '@/shared/components/ui-bits';
import Modal from '@/shared/components/Modal';

const empty = { name: '', slug: '', icon: '', description: '', sort_order: 0, is_active: true };

export default function AdminCategories() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);

  const load = () => { setLoading(true); adminAPI.categoriesList().then(setItems).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const input = 'w-full rounded-lg border border-card-border bg-secondary px-3 py-2 text-sm outline-none focus:border-primary';

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await adminAPI.categorySave(form); toast({ title: 'Saved' }); setOpen(false); load(); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };
  const del = async (id: number) => { if (!confirm('Delete?')) return; try { await adminAPI.categoryDelete(id); load(); } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); } };

  return (
    <div>
      <PageHeader title="Categories" subtitle="Organise your VIP numbers"
        action={<button onClick={() => { setForm(empty); setOpen(true); }} className="btn-gold text-sm"><Plus className="h-4 w-4" /> Add Category</button>} />
      {loading ? <Loader /> : (
        <Table head={['Name', 'Slug', 'Numbers', 'Active', '']}>
          {items.map((c) => (
            <tr key={c.category_id} className="border-b border-card-border last:border-0">
              <td className="px-4 py-3 text-foreground">{c.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
              <td className="px-4 py-3 text-muted-foreground">{c.number_count ?? '—'}</td>
              <td className="px-4 py-3">{c.is_active ? '✓' : '—'}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setForm({ ...c, is_active: !!c.is_active }); setOpen(true); }} className="text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => del(c.category_id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title={form.category_id ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={save} className="space-y-3">
          <input required className={input} placeholder="Name" value={form.name} onChange={(e) => set('name', e.target.value)} />
          <input className={input} placeholder="Slug (auto if blank)" value={form.slug} onChange={(e) => set('slug', e.target.value)} />
          <input className={input} placeholder="Description" value={form.description || ''} onChange={(e) => set('description', e.target.value)} />
          <input type="number" className={input} placeholder="Sort order" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} /> Active</label>
          <button className="btn-gold w-full">Save</button>
        </form>
      </Modal>
    </div>
  );
}
