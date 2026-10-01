import { useEffect, useMemo, useState } from 'react';
import { Copy, KeyRound, Link2, Pencil, Plus, RefreshCw, ShieldOff } from 'lucide-react';
import { adminAPI, type PrivateCollection } from '@/core/api/vnwAPI';
import { EmptyState, Loader, PageHeader, Panel, StatusBadge, Table } from '@/shared/components/ui-bits';
import Modal from '@/shared/components/Modal';
import { useToast } from '@/shared/hooks/use-toast';

interface OfflineNumber { number_id: number; display_number: string; status: string; }

export default function AdminPrivateLinks() {
  const { toast } = useToast();
  const [links, setLinks] = useState<PrivateCollection[]>([]);
  const [numbers, setNumbers] = useState<OfflineNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [freshUrl, setFreshUrl] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [linkRows, numberData] = await Promise.all([
        adminAPI.privateLinksList({ page, limit: pageSize }),
        adminAPI.numbersList({ visibility_type: 'OFFLINE', status: 'ALL', limit: 60 }),
      ]);
      setLinks(linkRows.items || []); setTotal(linkRows.total || 0); setNumbers(numberData.items || []);
    } catch (error: any) { toast({ title: 'Could not load private links', description: error.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [page, pageSize]);

  const availableNumbers = useMemo(() => numbers.filter((number) => number.status !== 'SOLD'), [numbers]);
  const close = () => { setOpen(false); setEditingId(null); setName(''); setExpiresAt(''); setSelected([]); };
  const edit = (link: PrivateCollection) => { setEditingId(link.private_link_id); setName(link.name); setExpiresAt(link.expires_at ? String(link.expires_at).slice(0, 16) : ''); setSelected(link.number_ids || []); setOpen(true); };
  const copyUrl = async (url: string) => { await navigator.clipboard.writeText(url); toast({ title: 'Private URL copied' }); };
  const showToken = (token: string) => {
    const url = `${window.location.origin}/private/${token}`; setFreshUrl(url); void copyUrl(url);
  };
  const create = async () => {
    setBusy(true);
    try {
      if (editingId) {
        await adminAPI.privateLinkUpdate({ private_link_id: editingId, name, expires_at: expiresAt || null, number_ids: selected });
        close(); await load(); toast({ title: 'Private collection updated' });
      } else {
        const result = await adminAPI.privateLinkCreate({ name, expires_at: expiresAt || null, number_ids: selected });
        showToken(result.token); close(); await load(); toast({ title: 'Private collection created', description: 'The new URL was copied. Store it securely because the token is shown only now.' });
      }
    } catch (error: any) { toast({ title: 'Could not create collection', description: error.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };
  const rotate = async (id: number) => {
    try { const result = await adminAPI.privateLinkRotate(id); showToken(result.token); toast({ title: 'Private URL rotated', description: 'The previous URL no longer works.' }); }
    catch (error: any) { toast({ title: 'Could not rotate link', description: error.message, variant: 'destructive' }); }
  };
  const revoke = async (id: number) => {
    try { await adminAPI.privateLinkRevoke(id); await load(); toast({ title: 'Private link revoked' }); }
    catch (error: any) { toast({ title: 'Could not revoke link', description: error.message, variant: 'destructive' }); }
  };

  if (loading) return <Loader label="Loading private links" variant="table" />;
  return <div>
    <PageHeader title="Private Links" subtitle="Share Offline numbers through secure, named collections."
      action={<button onClick={() => setOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-black text-primary-foreground"><Plus className="h-4 w-4" /> Create collection</button>} />
    {freshUrl && <Panel className="mb-4 flex flex-wrap items-center justify-between gap-3 border-accent/30 bg-accent/5">
      <div className="min-w-0"><div className="text-xs font-black uppercase text-accent">Latest generated URL</div><div className="mt-1 break-all text-sm font-bold">{freshUrl}</div></div>
      <button onClick={() => copyUrl(freshUrl)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-black"><Copy className="h-4 w-4" /> Copy</button>
    </Panel>}
    {links.length ? <Table head={['Collection','Numbers','Expiry','Status','Actions']} pagination={{ page, pageSize, total, onPageChange: setPage, onPageSizeChange: (size) => { setPageSize(size); setPage(1); } }}>
      {links.map((link) => {
        const expired = Boolean(link.expires_at && new Date(link.expires_at) <= new Date());
        const status = link.revoked_at ? 'REVOKED' : expired ? 'EXPIRED' : 'ACTIVE';
        return <tr key={link.private_link_id} className="border-b">
          <td className="px-4 py-3"><div className="flex items-center gap-2 font-black"><Link2 className="h-4 w-4 text-accent" />{link.name}</div><div className="text-xs text-muted-foreground">ID {link.private_link_id}</div></td>
          <td className="px-4 py-3 font-bold">{Number(link.assigned_count || 0)}</td>
          <td className="px-4 py-3 text-sm">{link.expires_at ? new Date(link.expires_at).toLocaleString('en-IN') : 'No expiry'}</td>
          <td className="px-4 py-3"><StatusBadge status={status} /></td>
          <td className="px-4 py-3"><div className="flex flex-wrap gap-2">
            <button onClick={() => edit(link)} className="inline-flex h-9 items-center gap-1 rounded-xl border border-border px-3 text-xs font-black"><Pencil className="h-3.5 w-3.5" /> Edit</button>
            <button onClick={() => rotate(link.private_link_id)} className="inline-flex h-9 items-center gap-1 rounded-xl border border-border px-3 text-xs font-black"><RefreshCw className="h-3.5 w-3.5" /> Rotate</button>
            {!link.revoked_at && <button onClick={() => revoke(link.private_link_id)} className="inline-flex h-9 items-center gap-1 rounded-xl bg-destructive/10 px-3 text-xs font-black text-destructive"><ShieldOff className="h-3.5 w-3.5" /> Revoke</button>}
          </div></td>
        </tr>;
      })}
    </Table> : <EmptyState title="No private collections" subtitle="Create a named collection for your Offline inventory." />}

    <Modal open={open} onClose={close} title={editingId ? 'Edit Private Collection' : 'Create Private Collection'} wide>
      <div className="grid gap-4">
        <label className="grid gap-1.5 text-sm font-black">Collection name<input value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl border border-border bg-background px-3 font-medium" placeholder="Delhi premium clients" /></label>
        <label className="grid gap-1.5 text-sm font-black">Optional expiry<input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="h-11 rounded-xl border border-border bg-background px-3 font-medium" /></label>
        <fieldset className="rounded-2xl border border-border p-3"><legend className="px-2 text-sm font-black">Offline numbers</legend>
          <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
            {availableNumbers.map((number) => <label key={number.number_id} className="flex items-center gap-2 rounded-xl bg-muted/60 p-3 text-sm font-bold"><input type="checkbox" checked={selected.includes(number.number_id)} onChange={(e) => setSelected((current) => e.target.checked ? [...current,number.number_id] : current.filter((id) => id !== number.number_id))} />{number.display_number}</label>)}
          </div>
        </fieldset>
        <div className="rounded-xl bg-warning-soft p-3 text-xs font-bold text-warning"><KeyRound className="mr-1 inline h-4 w-4" />The bearer URL is displayed only after creation or rotation.</div>
        <button disabled={busy || name.trim().length < 3} onClick={create} className="h-11 rounded-xl bg-primary font-black text-primary-foreground disabled:opacity-50">{busy ? 'Saving…' : editingId ? 'Save collection' : 'Create and copy URL'}</button>
      </div>
    </Modal>
  </div>;
}
