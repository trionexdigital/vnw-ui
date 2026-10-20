import { useEffect, useState } from 'react';
import { Building2, CreditCard, Globe2, Save, ShieldCheck } from 'lucide-react';
import { adminAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, Loader } from '@/shared/components/ui-bits';

const GROUPS = [
  {
    title: 'Store identity', description: 'Public name, announcement and customer contact details.', icon: Globe2,
    fields: [
      ['SITE_TITLE', 'Site title'], ['SITE_TAGLINE', 'Tagline'], ['CONTACT_EMAIL', 'Contact email'],
      ['CONTACT_PHONE', 'Contact phone'], ['WHATSAPP', 'WhatsApp number'], ['SUPPORT_ADDRESS', 'Support address'],
      ['PROMO_TEXT', 'Promo bar text'], ['PROMO_COUPON', 'Promo coupon code'],
    ],
  },
  {
    title: 'Legal business details', description: 'Information shown in policies, invoices and statutory pages.', icon: Building2,
    fields: [
      ['LEGAL_BUSINESS_NAME', 'Legal business name'], ['LEGAL_REGISTERED_ADDRESS', 'Registered address'],
      ['LEGAL_JURISDICTION', 'Legal jurisdiction'], ['LEGAL_EMAIL', 'Legal contact email'],
      ['GSTIN', 'GSTIN (if applicable)'], ['CIN', 'CIN (if applicable)'], ['POLICY_EFFECTIVE_DATE', 'Policy effective date'],
    ],
  },
  {
    title: 'Grievance contact', description: 'Contact details used for formal customer complaints.', icon: ShieldCheck,
    fields: [
      ['GRIEVANCE_OFFICER_NAME', 'Grievance officer name'], ['GRIEVANCE_EMAIL', 'Grievance email'],
      ['GRIEVANCE_PHONE', 'Grievance phone'],
    ],
  },
] as const;

export default function AdminSettings() {
  const { toast } = useToast();
  const [vals, setVals] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => { adminAPI.settingsGet().then(setVals).catch(() => {}).finally(() => setLoading(false)); }, []);


  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { await adminAPI.settingsSave(vals); toast({ title: 'Settings saved' }); }
    catch (error: any) { toast({ title: 'Could not save settings', description: error.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  if (loading) return <Loader />;
  const input = 'h-9 w-full rounded-lg border border-border bg-card px-3 text-xs font-semibold outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15';

  return (
    <div className="admin-settings">
      <PageHeader title="Settings" subtitle="Manage storefront identity, contact and legal details." />
      <form onSubmit={save} className="space-y-3">
        <section className="admin-settings__section"><div className="grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_144px]"><div><h2 className="text-sm font-black">Checkout GST</h2><p className="mt-1 text-xs text-muted-foreground">Added after offer and coupon discounts. New orders store the rate and tax amount.</p></div><label className="grid gap-1 text-xs font-bold" htmlFor="gst-percent">GST percentage<input id="gst-percent" type="number" min="0" max="100" step="0.01" required value={vals.GST_PERCENT ?? '0'} onChange={e => setVals({ ...vals, GST_PERCENT: e.target.value })} className={input} /></label></div></section>
        {GROUPS.map(({ title, description, icon: Icon, fields }) => (
          <section key={title} className="admin-settings__section">
            <div className="admin-settings__heading"><span><Icon className="h-4 w-4" /></span><div><h2 className="text-foreground">{title}</h2><p>{description}</p></div></div>
            <div className="grid gap-3 md:grid-cols-2">
              {fields.map(([key, label]) => <label key={key} className={key.includes('ADDRESS') ? 'md:col-span-2' : 'min-w-0'}><span className="mb-1 block text-xs font-bold text-muted-foreground">{label}</span><input className={input} value={vals[key] || ''} onChange={(e) => setVals({ ...vals, [key]: e.target.value })} /></label>)}
            </div>
          </section>
        ))}

        <section className="admin-settings__section">
          <div className="admin-settings__heading mb-0"><span><CreditCard className="h-4 w-4" /></span><div><h2 className="text-foreground">Payment gateway</h2><p>Cashfree credentials are configured securely in the server environment and are never exposed in this page.</p></div></div>
        </section>

        <div className="admin-settings__actions"><button disabled={busy} className="btn-gold"><Save className="h-4 w-4" />{busy ? 'Saving…' : 'Save settings'}</button></div>
      </form>
    </div>
  );
}
