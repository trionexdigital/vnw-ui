import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { dealerAPI, numbersAPI } from '@/core/api/vnwAPI';
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
  const [f, setF] = useState<any>({
    display_number: '', title_label: 'Fancy VIP Number', sale_price: '',
    numerology_sum: '', description: '',
  });

  useEffect(() => {
    if (editing) numbersAPI.detail(Number(id)).then((n) => setF({
      display_number: n.display_number, title_label: n.title_label,
      sale_price: n.mrp, numerology_sum: n.numerology_sum || '', description: n.description || '',
    })).catch(() => {});
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
