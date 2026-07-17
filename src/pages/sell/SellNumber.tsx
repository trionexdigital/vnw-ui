import { useEffect, useState } from 'react';
import { sellAPI, categoriesAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, Panel, Loader, StatusBadge, Table, EmptyState, Money } from '@/shared/components/ui-bits';
import WalletPanel from '@/shared/components/WalletPanel';

export default function SellNumber() {
  const { toast } = useToast();
  const [cats, setCats] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState<any>({ display_number: '', operator: 'Any', category_id: '', asking_price: '', contact_phone: '', description: '' });

  const input = 'w-full rounded-lg border border-card-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-primary';
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  const load = () => { setLoading(true); sellAPI.mine().then(setRows).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { categoriesAPI.list().then(setCats).catch(() => {}); load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      await sellAPI.create({
        ...f,
        number_value: f.display_number.replace(/\s+/g, ''),
        category_id: f.category_id || null,
        asking_price: Number(f.asking_price),
      });
      toast({ title: 'Request submitted', description: 'Your number is pending admin review.' });
      setF({ display_number: '', operator: 'Any', category_id: '', asking_price: '', contact_phone: '', description: '' });
      load();
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  const cancel = async (request_id: number) => {
    try { await sellAPI.cancel(request_id); toast({ title: 'Request cancelled' }); load(); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Sell Your Number" subtitle="Offer your VIP number to us — our team reviews & approves each request" />
      <Panel className="mb-6">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="mb-1 block text-xs text-muted-foreground">Your Number (with spaces)</label>
            <input required className={input} placeholder="9876 543 210" value={f.display_number} onChange={(e) => set('display_number', e.target.value)} /></div>
          <div><label className="mb-1 block text-xs text-muted-foreground">Suggested Category</label>
            <select className={input} value={f.category_id} onChange={(e) => set('category_id', e.target.value)}>
              <option value="">Select</option>
              {cats.map((c) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
            </select></div>
          <div><label className="mb-1 block text-xs text-muted-foreground">Expected Price (₹)</label>
            <input required type="number" className={input} value={f.asking_price} onChange={(e) => set('asking_price', e.target.value)} /></div>
          <div><label className="mb-1 block text-xs text-muted-foreground">Contact Phone</label>
            <input className={input} placeholder="Where we can reach you" value={f.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="mb-1 block text-xs text-muted-foreground">Notes (optional)</label>
            <textarea rows={2} className={input} value={f.description} onChange={(e) => set('description', e.target.value)} /></div>
          <div className="sm:col-span-2"><button disabled={busy} className="btn-gold">{busy ? 'Submitting…' : 'Submit for Review'}</button></div>
        </form>
      </Panel>

      <div className="mb-6">
        <h2 className="mb-3 text-lg font-bold text-foreground">Your Wallet</h2>
        <p className="mb-3 text-sm text-muted-foreground">When we approve a number you sell to us, the agreed amount is credited here. Withdraw anytime.</p>
        <WalletPanel />
      </div>

      <h2 className="mb-3 text-lg font-bold text-foreground">My Sell Requests</h2>
      {loading ? <Loader /> : rows.length === 0 ? (
        <EmptyState title="No sell requests yet" subtitle="Submit your first number above." />
      ) : (
        <Table head={['Number', 'Asking', 'Offer', 'Status', 'Submitted', 'Action']}>
          {rows.map((r) => (
            <tr key={r.request_id} className="border-b border-card-border last:border-0">
              <td className="px-4 py-3 text-foreground">{r.display_number}</td>
              <td className="px-4 py-3"><Money value={r.asking_price} /></td>
              <td className="px-4 py-3">{r.offer_price ? <Money value={r.offer_price} /> : '—'}</td>
              <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              <td className="px-4 py-3 text-muted-foreground">{String(r.created_at).slice(0, 10)}</td>
              <td className="px-4 py-3">
                {r.status === 'PENDING'
                  ? <button onClick={() => cancel(r.request_id)} className="text-xs text-destructive hover:underline">Cancel</button>
                  : <span className="text-xs text-muted-foreground">{r.admin_note || '—'}</span>}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
