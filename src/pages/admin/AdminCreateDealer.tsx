import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, Panel, Loader } from '@/shared/components/ui-bits';

// Sensible default permission set pre-selected for a new dealer.
const DEFAULT_DEALER_PERMS = [
  'dealer.dashboard', 'dealer.listings.view', 'dealer.listings.create', 'dealer.listings.edit', 'dealer.sales', 'dealer.payouts', 'dealer.profile',
];

export default function AdminCreateDealer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [perms, setPerms] = useState<Set<string>>(new Set(DEFAULT_DEALER_PERMS));
  const [f, setF] = useState<any>({ full_name: '', email: '', phone: '', password: '', business_name: '', commission_pct: 10 });

  const input = 'w-full rounded-lg border border-card-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-primary';
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const toggle = (key: string) => setPerms((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  useEffect(() => {
    adminAPI.permissionCatalog()
      .then((c: any) => setCatalog((c || []).filter((p: any) => p.module === 'DEALER')))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      const res: any = await adminAPI.dealerCreate({ ...f, commission_pct: Number(f.commission_pct), permissions: Array.from(perms) });
      toast({ title: 'Dealer created', description: `Account ready (#${res.user_id}).` });
      navigate('/admin/dealers');
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  if (loading) return <Loader />;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Create Dealer" subtitle="Create a dealer account and map exactly what they can do" />
      <form onSubmit={submit} className="space-y-6">
        <Panel>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">Account Details</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="mb-1 block text-xs text-muted-foreground">Full Name</label>
              <input required className={input} value={f.full_name} onChange={(e) => set('full_name', e.target.value)} /></div>
            <div><label className="mb-1 block text-xs text-muted-foreground">Business Name</label>
              <input className={input} value={f.business_name} onChange={(e) => set('business_name', e.target.value)} /></div>
            <div><label className="mb-1 block text-xs text-muted-foreground">Email</label>
              <input required type="email" className={input} value={f.email} onChange={(e) => set('email', e.target.value)} /></div>
            <div><label className="mb-1 block text-xs text-muted-foreground">Phone</label>
              <input required className={input} value={f.phone} onChange={(e) => set('phone', e.target.value)} /></div>
            <div><label className="mb-1 block text-xs text-muted-foreground">Temporary Password</label>
              <input required className={input} value={f.password} onChange={(e) => set('password', e.target.value)} /></div>
            <div><label className="mb-1 block text-xs text-muted-foreground">Commission %</label>
              <input type="number" className={input} value={f.commission_pct} onChange={(e) => set('commission_pct', e.target.value)} /></div>
          </div>
        </Panel>

        <Panel>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">Dealer Permissions</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {catalog.map((p) => (
              <label key={p.perm_key} className="flex cursor-pointer items-start gap-3 rounded-lg border border-card-border p-3 hover:border-accent">
                <input type="checkbox" checked={perms.has(p.perm_key)} onChange={() => toggle(p.perm_key)} className="mt-0.5 h-4 w-4 accent-accent" />
                <span><span className="block text-sm font-medium text-foreground">{p.label}</span>
                  <span className="block text-xs text-muted-foreground">{p.description}</span></span>
              </label>
            ))}
          </div>
        </Panel>

        <div className="flex gap-3">
          <button disabled={busy} className="btn-gold">{busy ? 'Creating…' : 'Create Dealer'}</button>
          <button type="button" onClick={() => navigate('/admin/dealers')} className="btn-gold-outline">Cancel</button>
        </div>
      </form>
    </div>
  );
}
