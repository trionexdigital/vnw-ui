import { useEffect, useState } from 'react';
import { employeeAPI, categoriesAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, Loader, StatusBadge, Table, Money } from '@/shared/components/ui-bits';
import Modal from '@/shared/components/Modal';
import { operatorOptions } from '@/core/lib/format';

/**
 * Employee number management. All mutations are submitted to the admin approval
 * queue (employeeAPI.submit) rather than executed directly.
 */
export default function EmployeeNumbers() {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState<any>({ display_number: '', category_id: '', operator: 'Jio', mrp: '', offer_price: '' });

  const input = 'w-full rounded-lg border border-card-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-primary';
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  const load = () => { setLoading(true); employeeAPI.numbersList({ status: 'ALL', limit: 60 }).then((d: any) => setRows(d?.items || [])).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); categoriesAPI.list().then(setCats).catch(() => {}); }, []);

  const submitAction = async (action_key: string, payload: any, label: string) => {
    try { await employeeAPI.submit(action_key, payload); toast({ title: 'Submitted for approval', description: label }); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  const createNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitAction('numbers.save', {
      display_number: f.display_number,
      number_value: f.display_number.replace(/\s+/g, ''),
      category_id: f.category_id || null, operator: f.operator,
      mrp: Number(f.mrp), offer_price: Number(f.offer_price),
    }, `Create ${f.display_number}`);
    setShowForm(false); setF({ display_number: '', category_id: '', operator: 'Jio', mrp: '', offer_price: '' });
  };

  return (
    <div>
      <PageHeader title="Numbers" subtitle="Changes are applied after admin approval"
        action={<button onClick={() => setShowForm(true)} className="btn-gold">Add Number</button>} />
      {loading ? <Loader /> : (
        <Table head={['Number', 'Category', 'Price', 'Status', 'Actions']}>
          {rows.map((n) => (
            <tr key={n.number_id} className="border-b border-card-border last:border-0">
              <td className="px-4 py-3 text-foreground">{n.display_number}</td>
              <td className="px-4 py-3 text-muted-foreground">{n.category_name || '—'}</td>
              <td className="px-4 py-3"><Money value={n.offer_price} /></td>
              <td className="px-4 py-3"><StatusBadge status={n.status} /></td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2 text-xs">
                  {n.status === 'PENDING_APPROVAL' && (
                    <>
                      <button onClick={() => submitAction('numbers.approve', { number_id: n.number_id }, `Approve ${n.display_number}`)} className="text-emerald-400 hover:underline">Approve</button>
                      <button onClick={() => submitAction('numbers.reject', { number_id: n.number_id }, `Reject ${n.display_number}`)} className="text-amber-400 hover:underline">Reject</button>
                    </>
                  )}
                  <button onClick={() => submitAction('numbers.delete', { number_id: n.number_id }, `Delete ${n.display_number}`)} className="text-rose-400 hover:underline">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {showForm && (
        <Modal open onClose={() => setShowForm(false)} title="Add Number (needs approval)">
          <form onSubmit={createNumber} className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className="mb-1 block text-xs text-muted-foreground">Number (with spaces)</label>
              <input required className={input} placeholder="9876 543 210" value={f.display_number} onChange={(e) => set('display_number', e.target.value)} /></div>
            <div><label className="mb-1 block text-xs text-muted-foreground">Category</label>
              <select className={input} value={f.category_id} onChange={(e) => set('category_id', e.target.value)}>
                <option value="">Select</option>
                {cats.map((c) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
              </select></div>
            <div><label className="mb-1 block text-xs text-muted-foreground">Operator</label>
              <select className={input} value={f.operator} onChange={(e) => set('operator', e.target.value)}>
                {operatorOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select></div>
            <div><label className="mb-1 block text-xs text-muted-foreground">MRP (₹)</label>
              <input required type="number" className={input} value={f.mrp} onChange={(e) => set('mrp', e.target.value)} /></div>
            <div><label className="mb-1 block text-xs text-muted-foreground">Offer Price (₹)</label>
              <input required type="number" className={input} value={f.offer_price} onChange={(e) => set('offer_price', e.target.value)} /></div>
            <div className="sm:col-span-2 flex gap-2"><button className="btn-gold">Submit for Approval</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-gold-outline">Cancel</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
