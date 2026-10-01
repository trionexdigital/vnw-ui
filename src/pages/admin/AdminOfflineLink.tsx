import { useEffect, useState } from 'react';
import { Copy, KeyRound, RefreshCw, ShieldOff } from 'lucide-react';
import { adminAPI, type PrivateCollection } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';

export default function AdminOfflineLink() {
  const { toast } = useToast();
  const [link, setLink] = useState<PrivateCollection | null>(null);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    const data = await adminAPI.privateLinksList({ page: 1, limit: 10 });
    setLink((data.items || [])[0] || null);
  };
  useEffect(() => { load().catch((error) => toast({ title: 'Could not load link', description: error.message, variant: 'destructive' })).finally(() => setLoading(false)); }, []);
  const saveToken = async (token: string) => {
    const next = `${window.location.origin}/private/${token}`;
    setUrl(next);
    try { await navigator.clipboard.writeText(next); toast({ title: 'Offline catalog link copied', description: 'Save this URL. The token is shown only now.' }); }
    catch { toast({ title: 'Offline catalog link created', description: 'Copy the URL shown here; the token is shown only now.' }); }
  };
  const run = async (action: 'create' | 'rotate' | 'revoke') => {
    setBusy(true);
    try {
      if (action === 'create') await saveToken((await adminAPI.privateLinkCreate({})).token);
      if (action === 'rotate' && link) await saveToken((await adminAPI.privateLinkRotate(link.private_link_id)).token);
      if (action === 'revoke' && link) { await adminAPI.privateLinkRevoke(link.private_link_id); setUrl(''); toast({ title: 'Offline catalog link revoked' }); }
      await load();
    } catch (error: any) { toast({ title: 'Could not update link', description: error.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };
  return <div className="max-w-3xl rounded-2xl border border-border bg-card p-5 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><KeyRound className="h-6 w-6 text-primary" /><div><h1 className="text-lg font-black">Offline catalog link</h1><p className="text-sm text-muted-foreground">One link shows all available Online and Offline numbers. The normal store shows Online numbers only.</p></div></div><span className="rounded-full bg-muted px-3 py-1 text-xs font-bold">{loading ? 'Loading' : !link ? 'Not created' : link.revoked_at ? 'Revoked' : 'Active'}</span></div>
    {url && <div className="mt-4 flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 p-3"><span className="min-w-0 flex-1 break-all text-sm font-semibold">{url}</span><button aria-label="Copy offline catalog link" title="Copy link" onClick={() => navigator.clipboard.writeText(url)} className="rounded-lg border border-border bg-card p-2"><Copy className="h-4 w-4" /></button></div>}
    <div className="mt-4 flex flex-wrap gap-2">{!link ? <button disabled={busy} onClick={() => void run('create')} className="btn-gold">Create link</button> : <><button disabled={busy} onClick={() => void run('rotate')} className="btn-gold"><RefreshCw className="h-4 w-4" /> {link.revoked_at ? 'Reactivate with new URL' : 'Rotate URL'}</button>{!link.revoked_at && <button disabled={busy} onClick={() => void run('revoke')} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-bold text-destructive"><ShieldOff className="h-4 w-4" /> Revoke</button>}</>}</div>
  </div>;
}
