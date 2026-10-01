import { useEffect, useState } from 'react';
import { employeeAPI } from '@/core/api/vnwAPI';
import { PageHeader, Loader, StatusBadge, Table, EmptyState } from '@/shared/components/ui-bits';

/** Employee's own queue of submitted actions and their approval status. */
export default function EmployeeSubmissions() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  useEffect(() => { setLoading(true); employeeAPI.mySubmissions({ page, limit: pageSize }).then((data) => { setRows(data.items || []); setTotal(data.total || 0); }).catch(() => {}).finally(() => setLoading(false)); }, [page, pageSize]);

  if (loading) return <Loader />;

  return (
    <div>
      <PageHeader title="My Submissions" subtitle="Actions you submitted and their approval status" />
      {rows.length === 0 ? (
        <EmptyState title="Nothing submitted yet" subtitle="Actions you take are queued here for admin approval." />
      ) : (
        <Table head={['Action', 'Type', 'Status', 'Submitted', 'Reviewed', 'Note']} pagination={{ page, pageSize, total, onPageChange: setPage, onPageSizeChange: (size) => { setPageSize(size); setPage(1); } }}>
          {rows.map((r) => (
            <tr key={r.approval_id} className="border-b border-card-border last:border-0">
              <td className="px-4 py-3 text-foreground">{r.summary}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{r.action_key}</td>
              <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              <td className="px-4 py-3 text-muted-foreground">{String(r.created_at).slice(0, 16).replace('T', ' ')}</td>
              <td className="px-4 py-3 text-muted-foreground">{r.reviewed_at ? String(r.reviewed_at).slice(0, 16).replace('T', ' ') : '—'}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{r.review_note || '—'}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
