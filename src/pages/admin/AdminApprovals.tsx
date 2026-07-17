import { useEffect, useState } from 'react';
import { adminAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, Loader, StatusBadge, Table, EmptyState } from '@/shared/components/ui-bits';

const STATUS_TABS = ['PENDING', 'APPROVED', 'REJECTED'];

export default function AdminApprovals() {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('PENDING');

  const load = () => { setLoading(true); adminAPI.approvalsList({ status: tab }).then(setRows).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  const approve = async (approval_id: number) => {
    try { await adminAPI.approvalApprove(approval_id); toast({ title: 'Approved', description: 'Action applied.' }); load(); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };
  const reject = async (approval_id: number) => {
    const note = window.prompt('Reason for rejection (optional):') || undefined;
    try { await adminAPI.approvalReject(approval_id, note); toast({ title: 'Rejected' }); load(); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  return (
    <div>
      <PageHeader title="Employee Approvals" subtitle="Actions requested by employees — nothing applies until you approve" />
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_TABS.map((s) => (
          <button key={s} onClick={() => setTab(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${tab === s ? 'gold-gradient-bg text-accent-foreground' : 'border border-card-border text-muted-foreground'}`}>{s}</button>
        ))}
      </div>
      {loading ? <Loader /> : rows.length === 0 ? (
        <EmptyState title="Nothing here" subtitle={`No ${tab.toLowerCase()} requests.`} />
      ) : (
        <Table head={['Requested Action', 'Type', 'Employee', 'Status', 'When', 'Actions']}>
          {rows.map((r) => (
            <tr key={r.approval_id} className="border-b border-card-border last:border-0 align-top">
              <td className="px-4 py-3 text-foreground">{r.summary}
                <details className="mt-1"><summary className="cursor-pointer text-xs text-muted-foreground">payload</summary>
                  <pre className="mt-1 max-w-xs overflow-x-auto rounded bg-secondary p-2 text-[11px] text-muted-foreground">{r.payload}</pre>
                </details>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{r.action_key}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{r.requested_by_name}<br />{r.requested_by_email}</td>
              <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              <td className="px-4 py-3 text-muted-foreground">{String(r.created_at).slice(0, 16).replace('T', ' ')}</td>
              <td className="px-4 py-3">
                {r.status === 'PENDING' ? (
                  <div className="flex gap-2 text-xs">
                    <button onClick={() => approve(r.approval_id)} className="text-success hover:underline">Approve</button>
                    <button onClick={() => reject(r.approval_id)} className="text-destructive hover:underline">Reject</button>
                  </div>
                ) : <span className="text-xs text-muted-foreground">{r.review_note || '—'}</span>}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
