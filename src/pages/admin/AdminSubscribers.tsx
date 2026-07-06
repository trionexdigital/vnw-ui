import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { adminAPI } from '@/core/api/vnwAPI';
import { PageHeader, Loader, Table, EmptyState, StatCard } from '@/shared/components/ui-bits';

export default function AdminSubscribers() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminAPI.newsletterList().then(setRows).catch(() => {}).finally(() => setLoading(false)); }, []);

  const exportCsv = () => {
    const csv = 'email,source,date\n' + rows.map((r) => `${r.email},${r.source},${String(r.created_at).slice(0, 10)}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'subscribers.csv'; a.click();
  };

  if (loading) return <Loader />;

  return (
    <div>
      <PageHeader title="Newsletter Subscribers" subtitle="Your marketing email list"
        action={rows.length ? <button onClick={exportCsv} className="btn-gold-outline text-sm"><Download className="h-4 w-4" /> Export CSV</button> : undefined} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Subscribers" value={rows.length} accent />
        <StatCard label="From Footer" value={rows.filter((r) => r.source === 'footer').length} />
        <StatCard label="From Home" value={rows.filter((r) => r.source === 'home').length} />
      </div>
      {rows.length === 0 ? <EmptyState title="No subscribers yet" subtitle="Newsletter signups will appear here." /> : (
        <Table head={['Email', 'Source', 'Subscribed']}>
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
