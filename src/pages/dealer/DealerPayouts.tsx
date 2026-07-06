import { useEffect, useState } from 'react';
import { dealerAPI } from '@/core/api/vnwAPI';
import { PageHeader, Loader, StatusBadge, Money, Table } from '@/shared/components/ui-bits';
import WalletPanel from '@/shared/components/WalletPanel';

export default function DealerPayouts() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); dealerAPI.payouts().then(setRows).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  if (loading) return <Loader />;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Payouts" subtitle="Your earnings wallet — withdraw and track payouts" />
      <div className="mb-6"><WalletPanel onChange={load} /></div>
      <h2 className="mb-3 text-lg font-bold text-foreground">Payout History</h2>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">No payout requests yet.</p> : (
        <Table head={['Amount', 'Status', 'Reference', 'Requested', 'Processed']}>
          {rows.map((r) => (
            <tr key={r.payout_id} className="border-b border-card-border last:border-0">
              <td className="px-4 py-3"><Money value={r.amount} /></td>
              <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              <td className="px-4 py-3 text-muted-foreground">{r.reference || '—'}</td>
              <td className="px-4 py-3 text-muted-foreground">{String(r.requested_at).slice(0, 10)}</td>
              <td className="px-4 py-3 text-muted-foreground">{r.processed_at ? String(r.processed_at).slice(0, 10) : '—'}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
