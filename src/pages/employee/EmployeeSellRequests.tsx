import { useEffect, useState } from 'react';
import { employeeAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, Loader, StatusBadge, Table, EmptyState, Money } from '@/shared/components/ui-bits';

const STATUS_TABS = ['PENDING', 'APPROVED', 'REJECTED'];

/** Employee sell-request review — approve/reject are submitted for admin approval. */
export default function EmployeeSellRequests() {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('PENDING');

  const load = () => { setLoading(true); employeeAPI.sellList({ status: tab }).then(setRows).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  const submit = async (action_key: string, payload: any, label: string) => {
    try { await employeeAPI.submit(action_key, payload); toast({ title: 'Submitted for approval', description: label }); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  return (
    <div>
      <PageHeader title="Sell Requests" subtitle="Approve/reject is submitted to admin for final sign-off" />
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_TABS.map((s) => (
          <button key={s} onClick={() => setTab(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${tab === s ? 'gold-gradient-bg text-accent-foreground' : 'border border-card-border text-muted-foreground'}`}>{s}</button>
        ))}
      </div>
      {loading ? <Loader /> : rows.length === 0 ? (
        <EmptyState title="No requests" subtitle={`No ${tab.toLowerCase()} sell requests.`} />
      ) : (
        <Table head={['Number', 'Customer', 'Asking', 'Status', 'Actions']}>
          {rows.map((r) => (
            <tr key={r.request_id} className="border-b border-card-border last:border-0">
              <td className="px-4 py-3 text-foreground">{r.display_number}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{r.full_name}<br />{r.email}</td>
              <td className="px-4 py-3"><Money value={r.asking_price} /></td>
              <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              <td className="px-4 py-3">
                {r.status === 'PENDING' ? (
                  <div className="flex gap-2 text-xs">
                    <button onClick={() => submit('sell.approve', { request_id: r.request_id }, `Approve sell #${r.request_id}`)} className="text-success hover:underline">Approve</button>
                    <button onClick={() => submit('sell.reject', { request_id: r.request_id }, `Reject sell #${r.request_id}`)} className="text-destructive hover:underline">Reject</button>
                  </div>
                ) : <span className="text-xs text-muted-foreground">{r.admin_note || '—'}</span>}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
