import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { dealerAPI, categoriesAPI, numbersAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, Panel } from '@/shared/components/ui-bits';
import { numerologySum, formatINR } from '@/core/lib/format';

export default function DealerListingForm() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cats, setCats] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  // Pricing model: dealer enters a Sale Price and a flat Discount Amount.
  // Final price = sale_price − discount_amount; the % shown on cards is derived from these.
  const [f, setF] = useState<any>({
    display_number: '', category_id: '', title_label: 'Fancy VIP Number', sale_price: '', discount_amount: '',
    numerology_sum: '', operator: 'Any', description: '',
  });

  useEffect(() => { categoriesAPI.list().then(setCats).catch(() => {}); }, []);
  useEffect(() => {
    if (editing) numbersAPI.detail(Number(id)).then((n) => setF({
      display_number: n.display_number, category_id: n.category_id || '', title_label: n.title_label,
      sale_price: n.mrp, discount_amount: Math.max(0, Number(n.mrp) - Number(n.offer_price)),
      numerology_sum: n.numerology_sum || '', operator: 'Any', description: n.description || '',
    })).catch(() => {});
  }, [id]);

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const input = 'w-full rounded-lg border border-card-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-primary';

  const salePrice = Number(f.sale_price) || 0;
  const discountAmt = Math.min(Number(f.discount_amount) || 0, salePrice);
  const finalPrice = Math.max(0, salePrice - discountAmt);
  const discountPct = salePrice > 0 ? Math.round((discountAmt / salePrice) * 100) : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salePrice <= 0) { toast({ title: 'Enter a valid sale price', variant: 'destructive' }); return; }
    setBusy(true);
    try {
      const payload = {
        display_number: f.display_number,
        number_value: f.display_number.replace(/\s+/g, ''),
        category_id: f.category_id || null,
        title_label: f.title_label,
        operator: f.operator,
        description: f.description,
        numerology_sum: f.numerology_sum || numerologySum(f.display_number),
        // Sale Price → mrp; final price → offer_price. Server derives discount_pct.
        mrp: salePrice,
        offer_price: finalPrice,
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
          <div><label className="mb-1 block text-xs text-muted-foreground">Category</label>
            <select className={input} value={f.category_id} onChange={(e) => set('category_id', e.target.value)}>
              <option value="">Select</option>
              {cats.map((c) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
            </select></div>
          <div><label className="mb-1 block text-xs text-muted-foreground">Label</label>
            <input className={input} value={f.title_label} onChange={(e) => set('title_label', e.target.value)} /></div>
          <div><label className="mb-1 block text-xs text-muted-foreground">Sale Price (₹)</label>
            <input required type="number" min="0" className={input} value={f.sale_price} onChange={(e) => set('sale_price', e.target.value)} /></div>
          <div><label className="mb-1 block text-xs text-muted-foreground">Discount Amount (₹)</label>
            <input type="number" min="0" className={input} value={f.discount_amount} onChange={(e) => set('discount_amount', e.target.value)} /></div>
          <div><label className="mb-1 block text-xs text-muted-foreground">Numerology Sum (auto)</label>
            <input type="number" className={input} placeholder={String(numerologySum(f.display_number) || '')} value={f.numerology_sum} onChange={(e) => set('numerology_sum', e.target.value)} /></div>

          {/* live pricing preview */}
          <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-card-border bg-secondary/50 px-4 py-3">
            <div className="text-sm">
              <span className="text-muted-foreground line-through">{formatINR(salePrice)}</span>
              <span className="ml-2 text-lg font-extrabold text-destructive">{formatINR(finalPrice)}</span>
            </div>
            <span className="rounded-full bg-destructive px-3 py-1 text-xs font-bold text-destructive-foreground">{discountPct}% OFF</span>
          </div>

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
