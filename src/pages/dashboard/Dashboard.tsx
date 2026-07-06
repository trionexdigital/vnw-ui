import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, Gift, IndianRupee } from 'lucide-react';
import { dashboardAPI } from '@/core/api/vnwAPI';
import { PageHeader, StatCard, Loader, StatusBadge, Money, EmptyState } from '@/shared/components/ui-bits';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { dashboardAPI.summary().then(setData).catch(() => {}).finally(() => setLoading(false)); }, []);

  if (loading) return <Loader />;
  const d = data || {};

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Your VIP Number World account at a glance"
        action={<Link to="/shop" className="btn-gold text-sm">Browse Numbers</Link>} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Orders" value={d.total_orders ?? 0} icon={<ShoppingBag className="h-5 w-5" />} />
        <StatCard label="Total Spent" value={<Money value={d.total_spent ?? 0} />} icon={<IndianRupee className="h-5 w-5" />} accent />
        <StatCard label="Wishlist" value={d.wishlist_count ?? 0} icon={<Heart className="h-5 w-5" />} />
        <StatCard label="Referral Earnings" value={<Money value={d.referral_earned ?? 0} />} icon={<Gift className="h-5 w-5" />} />
      </div>

      <h2 className="mb-3 mt-8 text-lg font-bold text-foreground">Recent Orders</h2>
      {d.recent_orders?.length ? (
        <div className="vnw-card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-card-border text-left text-xs uppercase text-muted-foreground">
              <th className="px-4 py-3">Order</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th><th /></tr></thead>
            <tbody>
              {d.recent_orders.map((o: any) => (
                <tr key={o.order_id} className="border-b border-card-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{o.order_no}</td>
                  <td className="px-4 py-3"><Money value={o.total} /></td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{String(o.created_at).slice(0, 10)}</td>
                  <td className="px-4 py-3 text-right"><Link to={`/orders/${o.order_id}`} className="text-primary hover:underline">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState title="No orders yet" subtitle="Your purchases will appear here." action={<Link to="/shop" className="btn-gold">Start Shopping</Link>} />}
    </div>
  );
}
