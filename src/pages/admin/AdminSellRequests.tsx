import { useEffect, useState } from 'react';
import { adminAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, Loader, StatusBadge, Table, EmptyState, Money } from '@/shared/components/ui-bits';
import Modal from '@/shared/components/Modal';
import { getPrimaryCategory } from '@/core/categories/types';

const STATUS_TABS = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

export default function AdminSellRequests() {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('PENDING');
  const [approve, setApprove] = useState<any | null>(null);
  const [offer, setOffer] = useState('');
  const [buy, setBuy] = useState('');
  const [note, setNote] = useState('');

  const load = () => { setLoading(true); adminAPI.sellList({ status: tab }).then(setRows).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  const doApprove = async () => {
    try {
      await adminAPI.sellApprove({
        request_id: approve.request_id,
        offer_price: Number(offer) || undefined,
        buy_price: Number(buy) || undefined,
        admin_note: note || undefined,
      });
      toast({ title: 'Approved', description: 'Seller paid to wallet; listing created.' });
      setApprove(null); setOffer(''); setBuy(''); setNote(''); load();
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };
  const doReject = async (request_id: number) => {
    const admin_note = window.prompt('Reason for rejection (optional):') || undefined;
    try { await adminAPI.sellReject({ request_id, admin_note }); toast({ title: 'Rejected' }); load(); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  return (
    <div>
      <PageHeader title="Sell Requests" subtitle="Customers offering their numbers to the platform" />
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_TABS.map((s) => (
          <button key={s} onClick={() => setTab(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${tab === s ? 'gold-gradient-bg text-accent-foreground' : 'border border-card-border text-muted-foreground'}`}>{s}</button>
        ))}
      </div>
      {loading ? <Loader /> : rows.length === 0 ? (
        <EmptyState title="No requests" subtitle={`No ${tab.toLowerCase()} sell requests.`} />
      ) : (
        <Table head={['Number', 'Customer', 'Asking', 'Status', 'Submitted', 'Actions']}>
          {rows.map((r) => (
            <tr key={r.request_id} className="border-b border-card-border last:border-0">
              <td className="px-4 py-3 text-foreground">{r.display_number}<br /><span className="text-xs text-muted-foreground">{getPrimaryCategory(r)?.name || 'Unique'}</span></td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{r.full_name}<br />{r.email}<br />{r.contact_phone || r.user_phone}</td>
              <td className="px-4 py-3"><Money value={r.asking_price} /></td>
              <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              <td className="px-4 py-3 text-muted-foreground">{String(r.created_at).slice(0, 10)}</td>
              <td className="px-4 py-3">
                {r.status === 'PENDING' ? (
                  <div className="flex gap-2 text-xs">
                    <button onClick={() => { setApprove(r); setOffer(String(r.asking_price)); setBuy(String(r.asking_price)); }} className="text-success hover:underline">Approve</button>
                    <button onClick={() => doReject(r.request_id)} className="text-destructive hover:underline">Reject</button>
                  </div>
                ) : <span className="text-xs text-muted-foreground">{r.admin_note || '—'}</span>}
              </td>
            </tr>
          ))}
        </Table>
      )}

      {approve && (
        <Modal open onClose={() => setApprove(null)} title={`Approve ${approve.display_number}`}>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Approving pays the seller into their wallet and creates a live catalog listing owned by the platform.</p>
            <div><label className="mb-1 block text-xs text-muted-foreground">Buy Price — paid to seller's wallet (₹)</label>
              <input type="number" value={buy} onChange={(e) => setBuy(e.target.value)} className="w-full rounded-lg border border-card-border bg-secondary px-3 py-2.5 text-sm outline-none" /></div>
            <div><label className="mb-1 block text-xs text-muted-foreground">List Price — what we sell it for (₹)</label>
              <input type="number" value={offer} onChange={(e) => setOffer(e.target.value)} className="w-full rounded-lg border border-card-border bg-secondary px-3 py-2.5 text-sm outline-none" /></div>
            <div><label className="mb-1 block text-xs text-muted-foreground">Note to customer (optional)</label>
              <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-lg border border-card-border bg-secondary px-3 py-2.5 text-sm outline-none" /></div>
            <div className="flex gap-2">
              <button onClick={doApprove} className="btn-gold">Approve & List</button>
              <button onClick={() => setApprove(null)} className="btn-gold-outline">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
