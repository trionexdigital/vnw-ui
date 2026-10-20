import { useEffect, useState } from 'react';
import { Copy, KeyRound, RefreshCw, ShieldOff } from 'lucide-react';
import { adminAPI, type PrivateCollection } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import './AdminOfflineLink.css';

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
  return <section className="admin-offline-link rounded-2xl border border-border bg-card shadow-sm" aria-labelledby="offline-catalog-title">
    <div className="admin-offline-link__header">
      <div className="admin-offline-link__identity">
        <span className="admin-offline-link__icon"><KeyRound aria-hidden="true" className="h-4 w-4" /></span>
        <div className="min-w-0">
          <h1 id="offline-catalog-title" className="admin-offline-link__title">Offline catalog link</h1>
          <p className="admin-offline-link__description">One link shows all available Online and Offline numbers. The normal store shows Online numbers only.</p>
        </div>
      </div>
      <span className="admin-offline-link__status rounded-full bg-muted font-bold">{loading ? 'Loading' : !link ? 'Not created' : link.revoked_at ? 'Revoked' : 'Active'}</span>
    </div>
    {url && <div className="admin-offline-link__url rounded-xl border border-primary/25 bg-primary/5">
      <span translate="no" className="min-w-0 flex-1 break-all text-xs font-semibold">{url}</span>
      <button aria-label="Copy offline catalog link" title="Copy link" onClick={() => navigator.clipboard.writeText(url)} className="admin-offline-link__copy rounded-lg border border-border bg-card"><Copy className="h-4 w-4" /></button>
    </div>}
    <div className="admin-offline-link__actions">
      {!link ? <button disabled={busy} onClick={() => void run('create')} className="btn-gold inline-flex items-center justify-center gap-2">Create link</button> : <>
        <button disabled={busy} onClick={() => void run('rotate')} className="btn-gold inline-flex items-center justify-center gap-2"><RefreshCw className="h-4 w-4" /> {link.revoked_at ? 'Reactivate with new URL' : 'Rotate URL'}</button>
        {!link.revoked_at && <button disabled={busy} onClick={() => void run('revoke')} className="btn-gold-outline inline-flex items-center justify-center gap-2 text-destructive"><ShieldOff className="h-4 w-4" /> Revoke</button>}
      </>}
    </div>
  </section>;
}
