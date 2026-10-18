import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { adminAPI, type DeliveryCity } from '@/core/api/vnwAPI';
import { PageHeader, Loader, EmptyState, Table } from '@/shared/components/ui-bits';
import { useToast } from '@/shared/hooks/use-toast';
import Modal from '@/shared/components/Modal';

const EMPTY: Partial<DeliveryCity> = { city_name: '', state_name: '', description: '', is_active: true, is_highlighted: false, sort_order: 0 };
export default function AdminDeliveryCities() {
  const { toast } = useToast();
  const [rows, setRows] = useState<DeliveryCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Partial<DeliveryCity> | null>(null);
  const [removing, setRemoving] = useState<DeliveryCity | null>(null);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try { setRows(await adminAPI.deliveryCitiesList()); }
    catch (failure: any) { setError(failure.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (!editing) return; setBusy(true);
    try { await adminAPI.deliveryCitySave(editing); setEditing(null); toast({ title: 'Delivery city saved' }); await load(); }
    catch (failure: any) { toast({ title: 'Could not save city', description: failure.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!removing) return; setBusy(true);
    try { await adminAPI.deliveryCityDelete(removing.city_id); setRemoving(null); toast({ title: 'Delivery city removed' }); await load(); }
    catch (failure: any) { toast({ title: 'Could not remove city', description: failure.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };
  const field = 'h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-medium';
  return <div><PageHeader title="Home Delivery Cities" subtitle="Manage the service areas displayed on the homepage, highlight cities and set their display order." action={<button onClick={() => setEditing({ ...EMPTY })} className="btn-gold"><Plus size={16} />Add city</button>} />
    {loading ? <Loader /> : error ? <div role="alert" className="rounded-xl border border-border p-4 text-sm">{error}<button className="btn-gold-outline ml-3" onClick={load}>Retry</button></div> : !rows.length ? <EmptyState title="No delivery cities configured" subtitle="Add a city and enable it to display the home-delivery section on the storefront." /> : <Table head={['City', 'State', 'Description', 'Display order', 'Visibility', 'Highlight', 'Actions']}>{rows.map((city) => <tr key={city.city_id} className="border-b"><td>{city.city_name}</td><td>{city.state_name}</td><td>{city.description || '—'}</td><td>{city.sort_order}</td><td>{Number(city.is_active) ? 'Visible' : 'Hidden'}</td><td>{Number(city.is_highlighted) ? 'Featured' : 'Standard'}</td><td><div className="flex gap-3"><button onClick={() => setEditing({ ...city })} className="font-bold text-primary">Edit</button><button onClick={() => setRemoving(city)} className="font-bold text-destructive">Remove</button></div></td></tr>)}</Table>}
    <Modal open={Boolean(editing)} onClose={() => { if (!busy) setEditing(null); }} title={editing?.city_id ? 'Edit delivery city' : 'Add delivery city'}>{editing && <form onSubmit={save} className="grid gap-4"><label className="grid gap-1 text-sm font-bold">City<input required maxLength={96} className={field} value={editing.city_name} onChange={(event) => setEditing({ ...editing, city_name: event.target.value })} /></label><label className="grid gap-1 text-sm font-bold">State<input required maxLength={96} className={field} value={editing.state_name} onChange={(event) => setEditing({ ...editing, state_name: event.target.value })} /></label><label className="grid gap-1 text-sm font-bold">Description<textarea maxLength={255} className="min-h-20 rounded-xl border border-border bg-background p-3 text-sm" value={editing.description || ''} onChange={(event) => setEditing({ ...editing, description: event.target.value })} /></label><label className="grid gap-1 text-sm font-bold">Display order<input required type="number" min={0} max={10000} className={field} value={editing.sort_order} onChange={(event) => setEditing({ ...editing, sort_order: Number(event.target.value) })} /></label><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={Boolean(Number(editing.is_active))} onChange={(event) => setEditing({ ...editing, is_active: event.target.checked })} />Visible on storefront</label><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={Boolean(Number(editing.is_highlighted))} onChange={(event) => setEditing({ ...editing, is_highlighted: event.target.checked })} />Highlight this city</label><button disabled={busy} className="btn-gold">{busy ? 'Saving…' : 'Save city'}</button></form>}</Modal>
    <Modal open={Boolean(removing)} onClose={() => { if (!busy) setRemoving(null); }} title="Remove delivery city"><p className="mb-4 text-sm">Remove {removing?.city_name} from the service areas?</p><div className="flex gap-3"><button disabled={busy} onClick={remove} className="btn-gold">{busy ? 'Removing…' : 'Remove city'}</button><button disabled={busy} onClick={() => setRemoving(null)} className="btn-gold-outline">Cancel</button></div></Modal>
  </div>;
}
