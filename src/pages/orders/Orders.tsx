import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI } from '@/core/api/vnwAPI';
import { PageHeader, Loader, StatusBadge, Money, EmptyState, Table } from '@/shared/components/ui-bits';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { ordersAPI.my().then(setOrders).catch(() => {}).finally(() => setLoading(false)); }, []);

  if (loading) return <Loader />;

  return (
    <div>
      <PageHeader title="My Orders" subtitle="Track your VIP number purchases" />
      {orders.length === 0 ? (
        <EmptyState title="No orders yet" action={<Link to="/shop" className="btn-gold">Browse Numbers</Link>} />
      ) : (
        <Table head={['Order No', 'Items', 'Total', 'Payment', 'Status', 'Date', '']}>
          {orders.map((o) => (
            <tr key={o.order_id} className="border-b border-card-border last:border-0">
              <td className="px-4 py-3 font-medium text-foreground">{o.order_no}</td>
              <td className="px-4 py-3 text-muted-foreground">{o.item_count}</td>
              <td className="px-4 py-3"><Money value={o.total} /></td>
              <td className="px-4 py-3"><StatusBadge status={o.payment_status} /></td>
              <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
              <td className="px-4 py-3 text-muted-foreground">{String(o.created_at).slice(0, 10)}</td>
              <td className="px-4 py-3 text-right"><Link to={`/orders/${o.order_id}`} className="text-primary hover:underline">View</Link></td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
