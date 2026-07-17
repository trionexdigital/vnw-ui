import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { adminAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, Loader, StatusBadge, Table, EmptyState } from '@/shared/components/ui-bits';

export default function AdminReviews() {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); adminAPI.reviewsList().then(setRows).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const mod = async (id: number, status: string) => { try { await adminAPI.reviewModerate(id, status); toast({ title: 'Done' }); load(); } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); } };

  if (loading) return <Loader />;

  return (
    <div>
      <PageHeader title="Reviews" subtitle="Moderate customer reviews" />
      {rows.length === 0 ? <EmptyState title="No reviews" /> : (
        <Table head={['Number', 'User', 'Rating', 'Comment', 'Status', 'Actions']}>
          {rows.map((r) => (
            <tr key={r.review_id} className="border-b border-card-border last:border-0">
              <td className="px-4 py-3 font-bold text-foreground">{r.display_number}</td>
              <td className="px-4 py-3 text-muted-foreground">{r.full_name}</td>
              <td className="px-4 py-3"><span className="flex gap-0.5 text-primary">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3 w-3" fill="currentColor" />)}</span></td>
              <td className="px-4 py-3 max-w-xs text-muted-foreground">{r.comment}</td>
              <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              <td className="px-4 py-3">
                <div className="flex gap-2 text-xs">
                  <button onClick={() => mod(r.review_id, 'APPROVED')} className="text-success hover:underline">Approve</button>
                  <button onClick={() => mod(r.review_id, 'REJECTED')} className="text-warning hover:underline">Reject</button>
                  <button onClick={() => mod(r.review_id, 'DELETE')} className="text-destructive hover:underline">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
