import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { adminAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, Loader, StatusBadge, Table } from '@/shared/components/ui-bits';
import Modal from '@/shared/components/Modal';

export default function AdminDealers() {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [perms, setPerms] = useState<Set<string>>(new Set());
  const [savingPerms, setSavingPerms] = useState(false);

  const load = () => { setLoading(true); adminAPI.dealersList().then(setRows).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); adminAPI.permissionCatalog().then((c: any) => setCatalog((c || []).filter((p: any) => p.module === 'DEALER'))).catch(() => {}); }, []);

  const kyc = async (dealer_id: number, kyc_status: string) => { try { await adminAPI.dealerKyc({ dealer_id, kyc_status }); toast({ title: 'KYC updated' }); load(); } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); } };
  const commission = async (dealer_id: number, pct: string) => { try { await adminAPI.dealerKyc({ dealer_id, kyc_status: rows.find((r) => r.dealer_id === dealer_id)?.kyc_status, commission_pct: Number(pct) }); toast({ title: 'Commission updated' }); } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); } };

  const openPerms = async (d: any) => {
    setEditing(d); setPerms(new Set());
    try { const res: any = await adminAPI.userPermissionsGet(d.dealer_id); setPerms(new Set((res.effective || []).filter((k: string) => k !== '*'))); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };
  const toggle = (key: string) => setPerms((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const savePerms = async () => {
    setSavingPerms(true);
    try { await adminAPI.userPermissionsSet(editing.dealer_id, Array.from(perms)); toast({ title: 'Permissions updated' }); setEditing(null); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setSavingPerms(false); }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <PageHeader title="Dealers" subtitle="Create dealers, map permissions, verify KYC & set commissions"
        action={<Link to="/admin/dealers/new" className="btn-gold inline-flex items-center gap-2"><Plus className="h-4 w-4" /> Create Dealer</Link>} />
      <Table head={['Business', 'Contact', 'Listings', 'Commission %', 'KYC', 'Actions']}>
        {rows.map((d) => (
          <tr key={d.dealer_id} className="border-b border-card-border last:border-0">
            <td className="px-4 py-3 text-foreground">{d.business_name || d.full_name}</td>
            <td className="px-4 py-3 text-xs text-muted-foreground">{d.email}<br />{d.phone}</td>
            <td className="px-4 py-3 text-muted-foreground">{d.listings}</td>
            <td className="px-4 py-3">
              <input type="number" defaultValue={d.commission_pct} onBlur={(e) => commission(d.dealer_id, e.target.value)}
                className="w-16 rounded border border-card-border bg-secondary px-2 py-1 text-xs outline-none" />
            </td>
            <td className="px-4 py-3"><StatusBadge status={d.kyc_status} /></td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-2 text-xs">
                <button onClick={() => openPerms(d)} className="text-accent hover:underline">Permissions</button>
                <button onClick={() => kyc(d.dealer_id, 'VERIFIED')} className="text-success hover:underline">Verify</button>
                <button onClick={() => kyc(d.dealer_id, 'REJECTED')} className="text-destructive hover:underline">Reject</button>
              </div>
            </td>
          </tr>
        ))}
      </Table>

      {editing && (
        <Modal open onClose={() => setEditing(null)} title={`Permissions — ${editing.business_name || editing.full_name}`} wide>
          <div className="grid gap-2 sm:grid-cols-2">
            {catalog.map((p) => (
              <label key={p.perm_key} className="flex cursor-pointer items-start gap-3 rounded-lg border border-card-border p-3 hover:border-accent">
                <input type="checkbox" checked={perms.has(p.perm_key)} onChange={() => toggle(p.perm_key)} className="mt-0.5 h-4 w-4 accent-accent" />
                <span><span className="block text-sm font-medium text-foreground">{p.label}</span>
                  <span className="block text-xs text-muted-foreground">{p.description}</span></span>
              </label>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button disabled={savingPerms} onClick={savePerms} className="btn-gold">{savingPerms ? 'Saving…' : 'Save Permissions'}</button>
            <button onClick={() => setEditing(null)} className="btn-gold-outline">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
