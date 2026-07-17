import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { ordersAPI } from '@/core/api/vnwAPI';
import { Loader, StatusBadge, Money } from '@/shared/components/ui-bits';

export default function OrderDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const success = params.get('success') === '1';
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { ordersAPI.detail(Number(id)).then(setOrder).catch(() => {}).finally(() => setLoading(false)); }, [id]);

  if (loading) return <Loader />;
  if (!order) return <div className="text-muted-foreground">Order not found. <Link to="/orders" className="text-primary">Back</Link></div>;

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/orders" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> All Orders</Link>

      {success && (
        <div className="vnw-card mb-5 flex items-center gap-3 border-emerald-500/40 p-4">
          <CheckCircle2 className="h-6 w-6 text-success" />
          <div><div className="font-semibold text-foreground">Payment successful!</div>
            <div className="text-sm text-muted-foreground">Your number transfer will begin shortly.</div></div>
        </div>
      )}

      <div className="vnw-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-foreground">Order {order.order_no}</h1>
            <p className="text-sm text-muted-foreground">{String(order.created_at).slice(0, 16).replace('T', ' ')}</p>
          </div>
          <div className="flex gap-2"><StatusBadge status={order.payment_status} /><StatusBadge status={order.status} /></div>
        </div>

        <div className="mt-5 divide-y divide-card-border">
          {order.items?.map((it: any) => (
            <div key={it.order_item_id} className="flex items-center justify-between py-3">
              <div>
                <div className="text-lg font-bold text-foreground">{it.display_number}</div>
                <div className="text-xs text-muted-foreground">{it.category_name} · <StatusBadge status={it.item_status} /></div>
              </div>
              <Money value={it.price} />
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-1 border-t border-card-border pt-4 text-sm">
          <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{<Money value={order.subtotal} />}</span></div>
          {Number(order.discount) > 0 && <div className="flex justify-between text-muted-foreground"><span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</span><span>- <Money value={order.discount} /></span></div>}
          <div className="flex justify-between text-base font-bold"><span className="text-foreground">Total</span><Money value={order.total} /></div>
        </div>
      </div>
    </div>
  );
}
