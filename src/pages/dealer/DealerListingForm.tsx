import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { dealerAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, Panel } from '@/shared/components/ui-bits';
import { numerologySum } from '@/core/lib/format';
import DetectedCategories from '@/shared/components/DetectedCategories';

export default function DealerListingForm() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [pinsDirty, setPinsDirty] = useState(false);
  const [legacyPins, setLegacyPins] = useState(false);
  const [f, setF] = useState<any>({
    display_number: '', title_label: 'Fancy VIP Number', sale_price: '',
    numerology_sum: '', description: '', rtp_status: 'RTA', rtp_available_date: '', serviceable_pin_codes: '',
  });

  useEffect(() => {
    if (editing) dealerAPI.listings({number_id: Number(id), limit: 1}).then(data => {
      const n = data.items?.[0]; if (!n) throw new Error('Listing not found.');
      setLegacyPins(n.rtp_status === 'RTA' && !n.serviceable_pin_codes?.length);
      setF({display_number: n.display_number, title_label: n.title_label, sale_price: n.mrp, numerology_sum: n.numerology_sum || '', description: n.description || '', rtp_status: n.rtp_status, rtp_available_date: n.rtp_available_at ? new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(n.rtp_available_at.endsWith('Z') ? n.rtp_available_at : n.rtp_available_at+'Z')) : '', serviceable_pin_codes: (n.serviceable_pin_codes || []).join(', ')});
    }).catch(() => { toast({title:'Could not load listing',variant:'destructive'}); navigate('/dealer/listings'); });
  }, [id]);

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const input = 'w-full rounded-lg border border-card-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-primary';

  const salePrice = Number(f.sale_price) || 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salePrice <= 0) { toast({ title: 'Enter a valid sale price', variant: 'destructive' }); return; }
    setBusy(true);
    try {
      const payload = {
        display_number: f.display_number,
        number_value: f.display_number.replace(/\s+/g, ''),
        title_label: f.title_label,
        description: f.description,
        numerology_sum: f.numerology_sum || numerologySum(f.display_number),
        mrp: salePrice,
        rtp_status: f.rtp_status, rtp_available_date: f.rtp_available_date,
        serviceable_pin_codes: editing && legacyPins && !pinsDirty ? undefined : f.serviceable_pin_codes.split(/[,;\s]+/).filter(Boolean),
      };
      if (editing) { await dealerAPI.updateListing({ number_id: Number(id), ...payload }); toast({ title: 'Listing updated' }); }
      else { await dealerAPI.createListing(payload); toast({ title: 'Listing submitted', description: 'Pending admin approval.' }); }
      navigate('/dealer/listings');
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title={editing ? 'Edit Listing' : 'Add VIP Number'} subtitle={editing ? 'Update your number details' : 'New listings are reviewed by admin before going live'} />
      <Panel>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="mb-1 block text-xs text-muted-foreground">Number (with spaces)</label>
            <input required className={input} placeholder="9876 543 210" value={f.display_number} onChange={(e) => set('display_number', e.target.value)} /></div>
          <DetectedCategories number={f.display_number} className="sm:col-span-2" />
          <div><label className="mb-1 block text-xs text-muted-foreground">Label</label>
            <input className={input} value={f.title_label} onChange={(e) => set('title_label', e.target.value)} /></div>
          <div><label className="mb-1 block text-xs text-muted-foreground">MRP (₹)</label>
            <input required type="number" min="1" className={input} value={f.sale_price} onChange={(e) => set('sale_price', e.target.value)} /><p className="mt-1 text-[11px] text-muted-foreground">The store-wide discount is applied automatically.</p></div>
          <div><label className="mb-1 block text-xs text-muted-foreground">Numerology Sum (auto)</label>
            <input type="number" className={input} placeholder={String(numerologySum(f.display_number) || '')} value={f.numerology_sum} onChange={(e) => set('numerology_sum', e.target.value)} /></div>

          <label className="grid gap-1 text-xs text-muted-foreground">Readiness<select className={input} value={f.rtp_status} onChange={e => set('rtp_status', e.target.value)}><option value="RTA">RTA · Ready to activate</option><option value="RTP">RTP · Ready to port</option><option value="NON_RTP">NON-RTP · Pre-book</option></select></label>
          {f.rtp_status === 'RTA' && <label className="grid gap-1 text-xs text-muted-foreground">Serviceable PIN codes<textarea className={input} value={f.serviceable_pin_codes} onChange={e => { setPinsDirty(true); set('serviceable_pin_codes',e.target.value); }} placeholder="400001, 400002" /></label>}
          {f.rtp_status === 'NON_RTP' && <label className="grid gap-1 text-xs text-muted-foreground">Ready-to-port date (India)<input type="date" className={input} value={f.rtp_available_date} onChange={e=>set('rtp_available_date',e.target.value)} /></label>}
          <div className="sm:col-span-2"><label className="mb-1 block text-xs text-muted-foreground">Description</label>
            <textarea rows={2} className={input} value={f.description} onChange={(e) => set('description', e.target.value)} /></div>
          <div className="sm:col-span-2 flex gap-3">
            <button disabled={busy} className="btn-gold">{editing ? 'Save Changes' : 'Submit Listing'}</button>
            <button type="button" onClick={() => navigate('/dealer/listings')} className="btn-gold-outline">Cancel</button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
