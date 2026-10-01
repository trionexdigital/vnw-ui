import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { adminAPI } from '@/core/api/vnwAPI';
import { PageHeader, Loader, Table, EmptyState, StatCard } from '@/shared/components/ui-bits';

export default function AdminSubscribers() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [bySource, setBySource] = useState<Record<string, number>>({});
  useEffect(() => { setLoading(true); adminAPI.newsletterList({ page, limit: pageSize }).then((data) => { setRows(data.items || []); setTotal(Number(data.total || 0)); setBySource(data.by_source || {}); }).catch(() => {}).finally(() => setLoading(false)); }, [page, pageSize]);

  const exportCsv = async () => {
    const allRows = await adminAPI.newsletterList({ export_all: true });
    const csv = 'email,source,date\n' + allRows.map((r: any) => `${r.email},${r.source},${String(r.created_at).slice(0, 10)}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'subscribers.csv'; a.click(); window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  if (loading) return <Loader />;

  return (
    <div>
      <PageHeader title="Newsletter Subscribers" subtitle="Your marketing email list"
        action={total ? <button onClick={exportCsv} className="btn-gold-outline text-sm"><Download className="h-4 w-4" /> Export CSV</button> : undefined} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Subscribers" value={total} accent />
        <StatCard label="From Footer" value={bySource.footer || 0} />
        <StatCard label="From Home" value={bySource.home || 0} />
      </div>
      {rows.length === 0 ? <EmptyState title="No subscribers yet" subtitle="Newsletter signups will appear here." /> : (
        <Table head={['Email', 'Source', 'Subscribed']} pagination={{ page, pageSize, total, onPageChange: setPage, onPageSizeChange: (size) => { setPageSize(size); setPage(1); } }}>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-card-border last:border-0">
              <td className="px-4 py-3 text-foreground">{r.email}</td>
              <td className="px-4 py-3 text-muted-foreground">{r.source}</td>
              <td className="px-4 py-3 text-muted-foreground">{String(r.created_at).slice(0, 10)}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
