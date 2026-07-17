import { useEffect, useState } from 'react';
import { adminAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, Loader, StatusBadge, Money, Table, EmptyState } from '@/shared/components/ui-bits';

export default function AdminPayouts() {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); adminAPI.payoutsList().then(setRows).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const update = async (payout_id: number, status: string) => {
    const reference = status === 'PAID' ? (prompt('Payment reference (UTR/UPI ref):') || '') : '';
    try { await adminAPI.payoutUpdate({ payout_id, status, reference }); toast({ title: 'Payout updated' }); load(); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <PageHeader title="Dealer Payouts" subtitle="Approve and mark payouts as paid" />
      {rows.length === 0 ? <EmptyState title="No payout requests" /> : (
        <Table head={['Dealer', 'Amount', 'Status', 'Reference', 'Requested', 'Actions']}>
          {rows.map((r) => (
            <tr key={r.payout_id} className="border-b border-card-border last:border-0">
              <td className="px-4 py-3 text-foreground">{r.full_name}<div className="text-xs text-muted-foreground">{r.email}</div></td>
              <td className="px-4 py-3"><Money value={r.amount} /></td>
              <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              <td className="px-4 py-3 text-muted-foreground">{r.reference || '—'}</td>
              <td className="px-4 py-3 text-muted-foreground">{String(r.requested_at).slice(0, 10)}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2 text-xs">
                  <button onClick={() => update(r.payout_id, 'APPROVED')} className="text-info hover:underline">Approve</button>
                  <button onClick={() => update(r.payout_id, 'PAID')} className="text-success hover:underline">Mark Paid</button>
                  <button onClick={() => update(r.payout_id, 'REJECTED')} className="text-destructive hover:underline">Reject</button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
