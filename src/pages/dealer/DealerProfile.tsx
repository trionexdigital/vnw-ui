import { useEffect, useState } from 'react';
import { dealerAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, Panel, Loader, StatusBadge } from '@/shared/components/ui-bits';

export default function DealerProfile() {
  const { toast } = useToast();
  const [p, setP] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { dealerAPI.profile().then(setP).catch(() => {}); }, []);

  const set = (k: string, v: any) => setP((x: any) => ({ ...x, [k]: v }));
  const input = 'w-full rounded-lg border border-card-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-primary';

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      await dealerAPI.updateProfile({ business_name: p.business_name, gst_no: p.gst_no, payout_method: p.payout_method, payout_details: p.payout_details });
      toast({ title: 'Profile saved' });
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  if (!p) return <Loader />;

  return (
    <div className="max-w-2xl">
      <PageHeader title="Dealer Profile" subtitle="Your seller details & KYC status" />
      <Panel>
        <div className="mb-4 flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">KYC Status:</span> <StatusBadge status={p.kyc_status} />
          <span className="ml-auto text-muted-foreground">Commission: <b className="text-foreground">{p.commission_pct}%</b></span>
        </div>
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="mb-1 block text-xs text-muted-foreground">Business Name</label>
            <input className={input} value={p.business_name || ''} onChange={(e) => set('business_name', e.target.value)} /></div>
          <div><label className="mb-1 block text-xs text-muted-foreground">GST Number</label>
            <input className={input} value={p.gst_no || ''} onChange={(e) => set('gst_no', e.target.value)} /></div>
          <div><label className="mb-1 block text-xs text-muted-foreground">Payout Method</label>
            <select className={input} value={p.payout_method || ''} onChange={(e) => set('payout_method', e.target.value)}>
              <option value="">Select</option><option value="UPI">UPI</option><option value="BANK">Bank Transfer</option>
            </select></div>
          <div className="sm:col-span-2"><label className="mb-1 block text-xs text-muted-foreground">Payout Details (UPI ID / Account)</label>
            <input className={input} value={typeof p.payout_details === 'string' ? p.payout_details : ''} onChange={(e) => set('payout_details', e.target.value)} /></div>
          <div className="sm:col-span-2"><button disabled={busy} className="btn-gold">Save Profile</button></div>
        </form>
      </Panel>
    </div>
  );
}
