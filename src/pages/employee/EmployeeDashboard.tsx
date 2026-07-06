import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, ShoppingBag, Users2, ClipboardList } from 'lucide-react';
import { employeeAPI } from '@/core/api/vnwAPI';
import { PageHeader, StatCard, Loader, Panel } from '@/shared/components/ui-bits';

export default function EmployeeDashboard() {
  const [kpi, setKpi] = useState<any>({});
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      employeeAPI.dashboard().then((d: any) => setKpi(d?.kpi || {})).catch(() => {}),
      employeeAPI.mySubmissions().then((r: any[]) => setPending((r || []).filter((x) => x.status === 'PENDING').length)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      <PageHeader title="Employee Console" subtitle="Manage the marketplace — every change you make is applied after admin approval" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Numbers" value={kpi.numbers ?? '—'} icon={<Crown className="h-5 w-5" />} />
        <StatCard label="Orders" value={kpi.orders ?? '—'} icon={<ShoppingBag className="h-5 w-5" />} />
        <StatCard label="Users" value={kpi.users ?? '—'} icon={<Users2 className="h-5 w-5" />} />
        <StatCard label="My Pending Approvals" value={pending} accent icon={<ClipboardList className="h-5 w-5" />} />
      </div>

      <Panel className="mt-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/employee/numbers" className="btn-gold-outline">Manage Numbers</Link>
          <Link to="/employee/sell" className="btn-gold-outline">Review Sell Requests</Link>
          <Link to="/employee/users" className="btn-gold-outline">Manage Users</Link>
          <Link to="/employee/submissions" className="btn-gold-outline">My Submissions</Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Note: actions you take here are queued as approval requests. An administrator must approve them before they take effect.
        </p>
      </Panel>
    </div>
  );
}
