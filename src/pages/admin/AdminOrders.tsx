import { useEffect, useState } from 'react';
import { adminAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, Loader, StatusBadge, Money, Table } from '@/shared/components/ui-bits';

const ORDER_STATUSES = ['PENDING', 'PAID', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED'];

export default function AdminOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = () => { setLoading(true); adminAPI.ordersList({ status: filter || undefined }).then(setOrders).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const update = async (id: number, status: string) => {
    try { await adminAPI.orderUpdateStatus(id, status); toast({ title: 'Order updated' }); load(); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  return (
    <div>
      <PageHeader title="Orders" subtitle="Manage customer orders & fulfilment" />
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setFilter('')} className={`rounded-full px-3 py-1 text-xs ${!filter ? 'btn-gold' : 'btn-gold-outline'}`}>All</button>
        {ORDER_STATUSES.map((s) => <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-3 py-1 text-xs ${filter === s ? 'btn-gold' : 'btn-gold-outline'}`}>{s}</button>)}
      </div>
      {loading ? <Loader /> : (
        <Table head={['Order', 'Customer', 'Total', 'Payment', 'Status', 'Date', 'Update']}>
          {orders.map((o) => (
            <tr key={o.order_id} className="border-b border-card-border last:border-0">
              <td className="px-4 py-3 font-medium text-foreground">{o.order_no}</td>
              <td className="px-4 py-3 text-muted-foreground">{o.full_name || '—'}</td>
              <td className="px-4 py-3"><Money value={o.total} /></td>
              <td className="px-4 py-3"><StatusBadge status={o.payment_status} /></td>
              <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
              <td className="px-4 py-3 text-muted-foreground">{String(o.created_at).slice(0, 10)}</td>
              <td className="px-4 py-3">
                <select defaultValue={o.status} onChange={(e) => update(o.order_id, e.target.value)}
                  className="rounded-lg border border-card-border bg-secondary px-2 py-1 text-xs outline-none">
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
