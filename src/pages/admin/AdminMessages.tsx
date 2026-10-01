import { useEffect, useState } from 'react';
import { adminAPI } from '@/core/api/vnwAPI';
import { PageHeader, Loader, StatusBadge, Table, EmptyState } from '@/shared/components/ui-bits';

export default function AdminMessages() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  useEffect(() => { setLoading(true); adminAPI.messagesList({ page, limit: pageSize }).then((data) => { setRows(data.items || []); setTotal(Number(data.total || 0)); }).catch(() => {}).finally(() => setLoading(false)); }, [page, pageSize]);
  if (loading) return <Loader />;
  return (
    <div>
      <PageHeader title="Contact Messages" subtitle="Customer enquiries from the contact form" />
      {rows.length === 0 ? <EmptyState title="No messages" /> : (
        <Table head={['Name', 'Email', 'Subject', 'Message', 'Status', 'Date']} pagination={{ page, pageSize, total, onPageChange: setPage, onPageSizeChange: (size) => { setPageSize(size); setPage(1); } }}>
          {rows.map((m) => (
            <tr key={m.message_id} className="border-b border-card-border last:border-0 align-top">
              <td className="px-4 py-3 text-foreground">{m.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
              <td className="px-4 py-3 text-muted-foreground">{m.subject || '—'}</td>
              <td className="px-4 py-3 max-w-md text-muted-foreground">{m.message}</td>
              <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
              <td className="px-4 py-3 text-muted-foreground">{String(m.created_at).slice(0, 10)}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
