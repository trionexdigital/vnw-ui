import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users2, Crown, ShoppingBag, IndianRupee, Store, Hourglass } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { adminAPI } from '@/core/api/vnwAPI';
import { PageHeader, StatCard, Loader, StatusBadge, Money, Table } from '@/shared/components/ui-bits';

export default function AdminDashboard() {
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminAPI.dashboard().then(setD).catch(() => {}).finally(() => setLoading(false)); }, []);
  if (loading) return <Loader />;
  const k = d?.kpi || {};

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="VIP Number World - business overview" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Revenue" value={<Money value={k.revenue ?? 0} />} icon={<IndianRupee className="h-5 w-5" />} accent />
        <StatCard label="Orders" value={k.orders ?? 0} icon={<ShoppingBag className="h-5 w-5" />} />
        <StatCard label="Paid Orders" value={k.paid_orders ?? 0} icon={<ShoppingBag className="h-5 w-5" />} />
        <StatCard label="Users" value={k.users ?? 0} icon={<Users2 className="h-5 w-5" />} />
        <StatCard label="Dealers" value={k.dealers ?? 0} icon={<Store className="h-5 w-5" />} />
        <StatCard label="Numbers" value={k.numbers ?? 0} icon={<Crown className="h-5 w-5" />} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Available" value={k.available ?? 0} />
        <StatCard label="Sold" value={k.sold ?? 0} />
        <StatCard label="Pending Approval" value={k.pending_approval ?? 0} icon={<Hourglass className="h-5 w-5" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="vnw-card p-5">
          <h3 className="mb-4 font-semibold text-foreground">Revenue (last 6 months)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d?.trend || []}>
                <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.5} /><stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--popover-border))', borderRadius: 8, color: 'hsl(var(--popover-foreground))' }} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="vnw-card p-5">
          <h3 className="mb-4 font-semibold text-foreground">Top Viewed Numbers</h3>
          <div className="space-y-2">
            {(d?.top_numbers || []).map((n: any) => (
              <div key={n.number_id} className="flex items-center justify-between text-sm">
                <span className="font-bold text-foreground">{n.display_number}</span>
                <span className="text-muted-foreground">{n.views} views</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Recent Orders</h3>
          <Link to="/admin/orders" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        <Table head={['Order', 'Customer', 'Total', 'Status', 'Date']}>
          {(d?.recent_orders || []).map((o: any) => (
            <tr key={o.order_id} className="border-b border-card-border last:border-0">
              <td className="px-4 py-3 font-medium text-foreground">{o.order_no}</td>
              <td className="px-4 py-3 text-muted-foreground">{o.full_name || '-'}</td>
              <td className="px-4 py-3"><Money value={o.total} /></td>
              <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
              <td className="px-4 py-3 text-muted-foreground">{String(o.created_at).slice(0, 10)}</td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  );
}
