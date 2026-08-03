import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, CircleHelp, Pencil, Plus, Trash2 } from 'lucide-react';
import { adminAPI, type FaqItem } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { EmptyState, Loader, PageHeader, StatusBadge } from '@/shared/components/ui-bits';
import Modal from '@/shared/components/Modal';

const blank: Partial<FaqItem> = { category: 'Buying & Porting', question: '', answer: '', is_active: true };
const field = 'w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';

export default function AdminFaqs() {
  const { toast } = useToast();
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<FaqItem>>(blank);
  const load = () => { setLoading(true); adminAPI.faqsList().then(setItems).catch((e) => toast({ title: 'Unable to load FAQs', description: e.message, variant: 'destructive' })).finally(() => setLoading(false)); };
  useEffect(load, []);
  const edit = (item?: FaqItem) => { setForm(item ? { ...item } : blank); setOpen(true); };
  const save = async (e: React.FormEvent) => { e.preventDefault(); setSaving(true); try { await adminAPI.faqSave(form); toast({ title: 'FAQ saved' }); setOpen(false); load(); } catch (error: any) { toast({ title: 'Could not save FAQ', description: error.message, variant: 'destructive' }); } finally { setSaving(false); } };
  const remove = async (item: FaqItem) => { if (!window.confirm(`Delete “${item.question}”?`)) return; try { await adminAPI.faqDelete(item.faq_id); load(); } catch (e: any) { toast({ title: 'Could not delete FAQ', description: e.message, variant: 'destructive' }); } };
  const move = async (index: number, offset: number) => { const target = index + offset; if (target < 0 || target >= items.length) return; const next = [...items]; [next[index], next[target]] = [next[target], next[index]]; setItems(next); try { await adminAPI.faqsReorder(next.map((x) => x.faq_id)); } catch (e: any) { toast({ title: 'Could not reorder FAQs', description: e.message, variant: 'destructive' }); load(); } };
  return <div><PageHeader title="Frequently Asked Questions" subtitle="Manage public help content and homepage FAQ ordering" action={<button onClick={() => edit()} className="btn-gold"><Plus className="h-4 w-4" /> Add FAQ</button>} />
    {loading ? <Loader /> : !items.length ? <EmptyState title="No FAQs yet" description="Create the first public help item." action={<button onClick={() => edit()} className="btn-gold">Add FAQ</button>} /> : <div className="space-y-3">{items.map((item, index) => <article key={item.faq_id} className="rounded-2xl border border-border bg-card p-4 shadow-sm"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><CircleHelp className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-black uppercase tracking-wide text-primary">{item.category}</span><StatusBadge status={item.is_active ? 'ACTIVE' : 'INACTIVE'} /></div><h2 className="mt-1 font-black text-foreground">{item.question}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.answer}</p></div><div className="flex shrink-0 gap-1"><button onClick={() => move(index, -1)} disabled={!index} className="grid h-8 w-8 place-items-center rounded-lg border border-border disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button><button onClick={() => move(index, 1)} disabled={index === items.length - 1} className="grid h-8 w-8 place-items-center rounded-lg border border-border disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button></div></div><div className="mt-3 flex justify-end gap-2"><button onClick={() => edit(item)} className="btn-gold-outline min-h-9 px-3 text-xs"><Pencil className="h-3.5 w-3.5" /> Edit</button><button onClick={() => remove(item)} className="inline-flex min-h-9 items-center gap-1 rounded-xl border border-destructive/30 px-3 text-xs font-bold text-destructive"><Trash2 className="h-3.5 w-3.5" /> Delete</button></div></article>)}</div>}
    <Modal open={open} onClose={() => setOpen(false)} title={form.faq_id ? 'Edit FAQ' : 'Add FAQ'}><form onSubmit={save} className="space-y-4"><input required className={field} placeholder="Category" list="faq-categories" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} /><datalist id="faq-categories"><option value="Buying & Porting" /><option value="Payments & Security" /><option value="Number Selection" /><option value="Numerology" /><option value="Support" /></datalist><input required className={field} placeholder="Question" value={form.question || ''} onChange={(e) => setForm({ ...form, question: e.target.value })} /><textarea required rows={7} className={field} placeholder="Clear, accurate answer" value={form.answer || ''} onChange={(e) => setForm({ ...form, answer: e.target.value })} /><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={Boolean(form.is_active)} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Published</label><button disabled={saving} className="btn-gold w-full">{saving ? 'Saving…' : 'Save FAQ'}</button></form></Modal>
  </div>;
}
