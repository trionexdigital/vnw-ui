import { useEffect, useMemo, useState } from 'react';
import { BadgePercent, Building2, CreditCard, Globe2, Save, ShieldCheck } from 'lucide-react';
import { adminAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, Loader } from '@/shared/components/ui-bits';
import { formatINR } from '@/core/lib/format';

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

  const discount = Math.min(99, Math.max(0, Number(vals.GLOBAL_NUMBER_DISCOUNT_PERCENT) || 0));
  const examplePrice = useMemo(() => 10000 * (100 - discount) / 100, [discount]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { await adminAPI.settingsSave(vals); toast({ title: 'Settings saved', description: 'The store discount has been applied to every catalog number.' }); }
    catch (error: any) { toast({ title: 'Could not save settings', description: error.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  if (loading) return <Loader />;
  const input = 'h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15';

  return (
    <div className="max-w-6xl">
      <PageHeader title="Settings" subtitle="Manage storefront pricing, identity, contact and legal details." />
      <form onSubmit={save} className="space-y-5">
        <section className="overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-card via-card to-primary/10 shadow-sm">
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_320px] lg:items-center">
            <div>
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><BadgePercent className="h-5 w-5" /></div>
              <h2 className="text-xl font-black text-foreground">Store-wide number discount</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Enter one discount percentage for the complete number catalog. Individual number forms only require MRP; their discounted prices are calculated automatically when these settings are saved.</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/80 p-4">
              <label className="text-xs font-black uppercase tracking-wide text-muted-foreground" htmlFor="global-discount">Discount percentage</label>
              <div className="relative mt-2"><input id="global-discount" required type="number" min="0" max="99" step="1" className={`${input} pr-12 text-lg`} value={vals.GLOBAL_NUMBER_DISCOUNT_PERCENT ?? '0'} onChange={(e) => setVals({ ...vals, GLOBAL_NUMBER_DISCOUNT_PERCENT: e.target.value })} /><span className="pointer-events-none absolute right-4 top-3 text-lg font-black text-primary">%</span></div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-xs"><span className="text-muted-foreground">Example: {formatINR(10000)} MRP</span><strong className="text-primary">{formatINR(examplePrice)}</strong></div>
            </div>
          </div>
        </section>

        {GROUPS.map(({ title, description, icon: Icon, fields }) => (
          <section key={title} className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span><div><h2 className="font-black text-foreground">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div></div>
            <div className="grid gap-4 md:grid-cols-2">
              {fields.map(([key, label]) => <label key={key} className={key.includes('ADDRESS') ? 'md:col-span-2' : ''}><span className="mb-1.5 block text-xs font-bold text-muted-foreground">{label}</span><input className={input} value={vals[key] || ''} onChange={(e) => setVals({ ...vals, [key]: e.target.value })} /></label>)}
            </div>
          </section>
        ))}

        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
          <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><CreditCard className="h-5 w-5" /></span><div><h2 className="font-black text-foreground">Payment gateway</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Razorpay credentials are configured securely in the server environment and are never exposed in this page.</p></div></div>
        </section>

        <div className="sticky bottom-4 z-10 flex justify-end"><button disabled={busy} className="btn-gold min-w-44 shadow-lg"><Save className="h-4 w-4" />{busy ? 'Saving…' : 'Save settings'}</button></div>
      </form>
    </div>
  );
}
