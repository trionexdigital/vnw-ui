import { useEffect, useState } from 'react';
import { dealerAPI } from '@/core/api/vnwAPI';
import { PageHeader, Loader, StatusBadge, Money, EmptyState, Table } from '@/shared/components/ui-bits';

export default function DealerSales() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { dealerAPI.sales().then(setRows).catch(() => {}).finally(() => setLoading(false)); }, []);
  if (loading) return <Loader />;
  return (
    <div>
      <PageHeader title="Sales" subtitle="Numbers you've sold and your earnings" />
      {rows.length === 0 ? <EmptyState title="No sales yet" subtitle="Your sold numbers will appear here." /> : (
        <Table head={['Order', 'Number', 'Price', 'Commission', 'Net', 'Payment', 'Date']}>
          {rows.map((r) => (
            <tr key={r.order_item_id} className="border-b border-card-border last:border-0">
              <td className="px-4 py-3 text-foreground">{r.order_no}</td>
              <td className="px-4 py-3 font-bold text-royal">{r.display_number}</td>
              <td className="px-4 py-3"><Money value={r.price} /></td>
              <td className="px-4 py-3 text-muted-foreground">- <Money value={r.commission_amount} /></td>
              <td className="px-4 py-3"><Money value={Number(r.price) - Number(r.commission_amount)} /></td>
              <td className="px-4 py-3"><StatusBadge status={r.payment_status} /></td>
              <td className="px-4 py-3 text-muted-foreground">{String(r.created_at).slice(0, 10)}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
