import { useEffect, useState } from 'react';
import { adminAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, Panel, Loader } from '@/shared/components/ui-bits';

const FIELDS: [string, string][] = [
  ['SITE_TITLE', 'Site Title'],
  ['SITE_TAGLINE', 'Tagline'],
  ['CONTACT_EMAIL', 'Contact Email'],
  ['CONTACT_PHONE', 'Contact Phone'],
  ['WHATSAPP', 'WhatsApp Number (digits, e.g. 917009170092)'],
  ['SUPPORT_ADDRESS', 'Support Address'],
  ['PROMO_TEXT', 'Promo Bar Text (storefront announcement)'],
  ['PROMO_COUPON', 'Promo Coupon Code'],
];

export default function AdminSettings() {
  const { toast } = useToast();
  const [vals, setVals] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => { adminAPI.settingsGet().then(setVals).catch(() => {}).finally(() => setLoading(false)); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { await adminAPI.settingsSave(vals); toast({ title: 'Settings saved' }); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  if (loading) return <Loader />;
  const input = 'w-full rounded-lg border border-card-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-primary';

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" subtitle="Site configuration & contact details" />
      <Panel className="mb-6">
        <form onSubmit={save} className="space-y-3">
          {FIELDS.map(([key, label]) => (
            <div key={key}>
              <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
              <input className={input} value={vals[key] || ''} onChange={(e) => setVals({ ...vals, [key]: e.target.value })} />
            </div>
          ))}
          <button disabled={busy} className="btn-gold">Save Settings</button>
        </form>
      </Panel>
      <Panel>
        <h3 className="mb-2 font-semibold text-foreground">Payment Gateway</h3>
        <p className="text-sm text-muted-foreground">
          Razorpay keys are configured securely on the server via the <code className="rounded bg-secondary px-1">.env</code> file
          (<code className="rounded bg-secondary px-1">RAZORPAY_KEY_ID</code>, <code className="rounded bg-secondary px-1">RAZORPAY_KEY_SECRET</code>,
          <code className="rounded bg-secondary px-1">RAZORPAY_WEBHOOK_SECRET</code>). They are never exposed to the browser.
        </p>
      </Panel>
    </div>
  );
}
