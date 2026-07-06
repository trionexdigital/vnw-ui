import { useEffect, useState } from 'react';
import { Copy, Gift, Users2 } from 'lucide-react';
import { referralAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, StatCard, Loader, Money, Table } from '@/shared/components/ui-bits';

export default function Referrals() {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { referralAPI.mySummary().then(setData).catch(() => {}).finally(() => setLoading(false)); }, []);

  if (loading) return <Loader />;
  const d = data || {};
  const link = `${window.location.origin}/register?ref=${d.referral_code || ''}`;

  const copy = () => { navigator.clipboard.writeText(link); toast({ title: 'Referral link copied!' }); };

  return (
    <div>
      <PageHeader title="Referrals" subtitle="Earn 2% rewards on every purchase your referrals make" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Referral Code" value={d.referral_code || '—'} icon={<Gift className="h-5 w-5" />} accent />
        <StatCard label="Referred Users" value={d.referred_count ?? 0} icon={<Users2 className="h-5 w-5" />} />
        <StatCard label="Total Earned" value={<Money value={d.total_earned ?? 0} />} accent />
      </div>

      <div className="vnw-card mt-6 p-5">
        <div className="mb-2 text-sm text-muted-foreground">Share your referral link</div>
        <div className="flex items-center gap-2">
          <input readOnly value={link} className="flex-1 rounded-lg border border-card-border bg-secondary px-3 py-2 text-sm outline-none" />
          <button onClick={copy} className="btn-gold text-sm"><Copy className="h-4 w-4" /> Copy</button>
        </div>
      </div>

      {d.referred?.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 font-semibold text-foreground">Your Referrals</h3>
          <Table head={['Name', 'Joined']}>
            {d.referred.map((r: any) => (
              <tr key={r.user_id} className="border-b border-card-border last:border-0">
                <td className="px-4 py-3 text-foreground">{r.full_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{String(r.created_at).slice(0, 10)}</td>
              </tr>
            ))}
          </Table>
        </div>
      )}
    </div>
  );
}
