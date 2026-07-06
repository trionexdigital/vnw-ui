import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListChecks, BadgeIndianRupee, Hourglass, CheckCircle2, Wallet } from 'lucide-react';
import { dealerAPI } from '@/core/api/vnwAPI';
import { PageHeader, StatCard, Loader, Money } from '@/shared/components/ui-bits';

export default function DealerDashboard() {
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { dealerAPI.dashboard().then(setD).catch(() => {}).finally(() => setLoading(false)); }, []);
  if (loading) return <Loader />;
  const s = d || {};
  return (
    <div>
      <PageHeader title="Dealer Dashboard" subtitle="Your listings & sales performance"
        action={<Link to="/dealer/listings/new" className="btn-gold text-sm">+ Add Number</Link>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Listings" value={s.total_listings ?? 0} icon={<ListChecks className="h-5 w-5" />} />
        <StatCard label="Available" value={s.available ?? 0} icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard label="Pending Approval" value={s.pending ?? 0} icon={<Hourglass className="h-5 w-5" />} />
        <StatCard label="Units Sold" value={s.units_sold ?? 0} icon={<BadgeIndianRupee className="h-5 w-5" />} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Gross Sales" value={<Money value={s.gross_sales ?? 0} />} accent />
        <StatCard label="Commission" value={<Money value={s.commission ?? 0} />} />
        <StatCard label="Net Earnings" value={<Money value={s.net_earnings ?? 0} />} />
        <StatCard label="Wallet Balance" value={<Money value={s.wallet_balance ?? 0} />} accent icon={<Wallet className="h-5 w-5" />} />
      </div>
      <div className="mt-6 flex gap-3">
        <Link to="/dealer/listings" className="btn-gold-outline text-sm">Manage Listings</Link>
        <Link to="/dealer/payouts" className="btn-gold-outline text-sm">Request Payout</Link>
      </div>
    </div>
  );
}
