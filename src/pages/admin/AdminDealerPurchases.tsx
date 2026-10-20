import NumberPricingPreview from './NumberPricingPreview';
import { ThemedSelect } from '@/shared/ui/themed-select';
import { Link } from 'react-router-dom';
import Combobox from '@/shared/ui/combobox';
import { useEffect, useMemo, useState } from 'react';
import { BadgeIndianRupee, Plus, RotateCcw, Search, Trash2, Undo2, WalletCards } from 'lucide-react';
import { adminAPI } from '@/core/api/vnwAPI';
import { EmptyState, Loader, Money, Panel, StatCard, StatusBadge, Table } from '@/shared/components/ui-bits';
import Modal from '@/shared/components/Modal';
import { useToast } from '@/shared/hooks/use-toast';

type Tab = 'INVENTORY' | 'SOLD' | 'DELETED';
interface Dealer { external_dealer_id: number; name: string; email?: string; phone?: string; dealer_user_id?: number; total_billed: number; total_paid: number; amount_remaining: number; }
interface Purchase { dealer_purchase_id: number; number_value: string; display_number: string; dealer_name: string; visibility_type: string; rtp_status: 'RTP' | 'NON_RTP' | 'RTA'; purchase_price: number; intended_sale_price: number; actual_sale_price?: number; sold_at?: string; profit?: number; deleted_reason?: string; deleted_at?: string; }
interface Summary { total_billed: number; total_paid: number; amount_remaining: number; inventory_count: number; sold_count: number; deleted_count: number; }
interface DealerPayment { dealer_payment_id: number; dealer_name: string; amount: number; payment_method?: string; reference_no?: string; paid_at: string; status: string; void_reason?: string; }

const todayLocal = () => {
  const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16);
};

export default function AdminDealerPurchases() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('INVENTORY');
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [summary, setSummary] = useState<Summary>({ total_billed: 0, total_paid: 0, amount_remaining: 0, inventory_count: 0, sold_count: 0, deleted_count: 0 });
  const [items, setItems] = useState<Purchase[]>([]);
  const [dealerId, setDealerId] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number[]>([]);
  const [batchNumbers, setBatchNumbers] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [soldOpen, setSoldOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [payments, setPayments] = useState<DealerPayment[]>([]);
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentPageSize, setPaymentPageSize] = useState(25);
  const [paymentTotal, setPaymentTotal] = useState(0);
  const [voidPaymentId, setVoidPaymentId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const emptyPurchaseForm = { numbers: '', external_dealer_id: '', visibility_type: 'ONLINE', rtp_status: 'RTA', serviceable_pin_codes: '', rtp_available_date: '', private_link_ids: [] as number[], purchase_price: '', intended_sale_price: '', additional_discount_pct: '' };
  const [form, setForm] = useState(emptyPurchaseForm);
  const [payment, setPayment] = useState({ external_dealer_id: '', amount: '', payment_method: 'BANK_TRANSFER', reference_no: '', notes: '', paid_at: todayLocal() });
  const [sale, setSale] = useState({ actual_sale_price: '', sold_at: todayLocal() });
  const [reason, setReason] = useState('');

  const loadReference = async () => {
    setDealers(await adminAPI.externalDealersList() || []);
  };
  const loadData = async () => {
    setLoading(true);
    try {
      const supplier = Number(dealerId) || undefined;
      const [summaryRow, listing] = await Promise.all([
        adminAPI.dealerPurchasesSummary(supplier), adminAPI.dealerPurchasesList({ state: tab, external_dealer_id: supplier, q, page, limit: pageSize }),
      ]);
      setSummary(summaryRow); setItems(listing.items || []); setTotal(Number(listing.total || 0)); setSelected([]);
    } catch (error: any) { toast({ title: 'Could not load dealer purchases', description: error.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadReference().catch(() => undefined); }, []);
  useEffect(() => { void loadData(); }, [tab, dealerId, q, page, pageSize]);

  const targetIds = useMemo(() => {
    const numbers = batchNumbers.split(/[\n,]+/).map((v) => v.replace(/\D/g, '')).filter(Boolean);
    if (!numbers.length) return selected;
    const ids = items.filter((item) => numbers.includes(item.number_value.replace(/\D/g, '')) || numbers.includes(item.display_number.replace(/\D/g, ''))).map((item) => item.dealer_purchase_id);
    return Array.from(new Set([...selected, ...ids]));
  }, [batchNumbers, selected, items]);

  const refresh = async (message?: string) => { await Promise.all([loadReference(), loadData()]); if (message) toast({ title: message }); };
  const createPurchases = async () => {
    setBusy(true);
    try {
      const externalDealerId = Number(form.external_dealer_id);
      if (!externalDealerId) throw new Error('Select an active dealer account.');
      await adminAPI.dealerPurchasesCreate({ ...form, serviceable_pin_codes: form.serviceable_pin_codes.split(/[,;\s]+/).filter(Boolean), external_dealer_id: externalDealerId, purchase_price: Number(form.purchase_price), intended_sale_price: form.intended_sale_price, additional_discount_pct: form.additional_discount_pct });
      setAddOpen(false); setForm(emptyPurchaseForm); await refresh('Dealer numbers added');
    } catch (error: any) { toast({ title: 'Could not add dealer numbers', description: error.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };
  const markSold = async () => {
    if (!targetIds.length) return;
    setBusy(true);
    try { await adminAPI.dealerPurchasesMarkSold({ dealer_purchase_ids: targetIds, actual_sale_price: sale.actual_sale_price || undefined, sold_at: sale.sold_at }); setSoldOpen(false); setBatchNumbers(''); await refresh('Numbers moved to Dealer Sales'); }
    catch (error: any) { toast({ title: 'Could not mark numbers sold', description: error.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };
  const deleteRows = async () => {
    if (!targetIds.length) return;
    setBusy(true);
    try { await adminAPI.dealerPurchasesDelete(targetIds, reason); setDeleteOpen(false); setReason(''); setBatchNumbers(''); await refresh('Numbers moved to Dealer Deletes'); }
    catch (error: any) { toast({ title: 'Could not delete numbers', description: error.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };
  const reverse = async (id: number) => { try { await adminAPI.dealerPurchasesReverseSold([id]); await refresh('Sale reversed'); } catch (e: any) { toast({ title: 'Could not reverse sale', description: e.message, variant: 'destructive' }); } };
  const restore = async (id: number) => { try { await adminAPI.dealerPurchasesRestore([id]); await refresh('Number restored'); } catch (e: any) { toast({ title: 'Could not restore number', description: e.message, variant: 'destructive' }); } };
  const recordPayment = async () => {
    setBusy(true);
    try { await adminAPI.dealerPaymentRecord({ ...payment, external_dealer_id: Number(payment.external_dealer_id), amount: Number(payment.amount) }); setPaymentOpen(false); setPayment({ external_dealer_id: '', amount: '', payment_method: 'BANK_TRANSFER', reference_no: '', notes: '', paid_at: todayLocal() }); await refresh('Dealer payment recorded'); }
    catch (error: any) { toast({ title: 'Could not record payment', description: error.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };
  const loadPayments = async (targetPage = paymentPage, targetLimit = paymentPageSize) => {
    const data = await adminAPI.dealerPaymentsList({ external_dealer_id: Number(dealerId) || undefined, page: targetPage, limit: targetLimit });
    setPayments(data.items || []); setPaymentTotal(data.total || 0);
  };
  const openPayments = async () => {
    try { setPaymentPage(1); await loadPayments(1); setPaymentsOpen(true); }
    catch (error: any) { toast({ title: 'Could not load payments', description: error.message, variant: 'destructive' }); }
  };
  useEffect(() => { if (paymentsOpen) void loadPayments().catch((error: any) => toast({ title: 'Could not load payments', description: error.message, variant: 'destructive' })); }, [paymentPage, paymentPageSize, paymentsOpen]);
  const voidPayment = async () => {
    if (!voidPaymentId) return;
    setBusy(true);
    try { await adminAPI.dealerPaymentVoid(voidPaymentId, reason); setVoidPaymentId(null); setReason(''); await loadPayments(); await refresh('Payment voided'); }
    catch (error: any) { toast({ title: 'Could not void payment', description: error.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  const tabs: Array<{ value: Tab; label: string; count: number }> = [
    { value: 'INVENTORY', label: 'Purchases (Inventory)', count: summary.inventory_count }, { value: 'SOLD', label: 'Dealer Sales', count: summary.sold_count }, { value: 'DELETED', label: 'Dealer Deletes', count: summary.deleted_count },
  ];

  return <div>
    <div className="mb-4 grid gap-3 md:grid-cols-3">
      <StatCard label="Total Billed" value={<Money value={summary.total_billed} className="text-foreground" />} icon={<WalletCards className="h-4 w-4" />} />
      <StatCard label="Total Paid" value={<Money value={summary.total_paid} />} icon={<BadgeIndianRupee className="h-4 w-4" />} />
      <StatCard label="Amount Remaining" value={<Money value={summary.amount_remaining} className={summary.amount_remaining ? 'text-warning' : 'text-success'} />} icon={<BadgeIndianRupee className="h-4 w-4" />} />
    </div>
    <div className="mb-4 grid gap-2 rounded-2xl bg-muted p-1 sm:grid-cols-3">
      {tabs.map((item) => <button key={item.value} onClick={() => { setTab(item.value); setPage(1); }} className={`rounded-xl px-3 py-3 text-sm font-black transition ${tab === item.value ? 'bg-card text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground'}`}>{item.label} <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">{item.count}</span></button>)}
    </div>
    <Panel className="mb-4 flex flex-wrap items-center gap-2">
      <ThemedSelect value={dealerId} onChange={(e) => { setDealerId(e.target.value); setPage(1); }} className="h-10 w-40 rounded-xl border border-border bg-background px-3 font-bold"><option value="">All dealers</option>{dealers.map((dealer) => <option key={dealer.external_dealer_id} value={dealer.external_dealer_id}>{dealer.name}</option>)}</ThemedSelect>
      <label className="relative min-w-40 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-3" placeholder="Search mobile number" /></label>
      <div className="ml-auto flex flex-wrap gap-2"><button onClick={() => setAddOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-3 text-xs font-black text-primary-foreground"><Plus className="h-4 w-4" /> Add Numbers</button><button onClick={() => setPaymentOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-black"><BadgeIndianRupee className="h-4 w-4" /> Record Payment</button><button onClick={openPayments} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-black"><WalletCards className="h-4 w-4" /> Payment History</button></div>
    </Panel>
    {tab !== 'DELETED' && <Panel className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto]">
      <textarea value={batchNumbers} onChange={(e) => setBatchNumbers(e.target.value)} className="min-h-20 rounded-xl border border-border bg-background p-3 text-sm" placeholder="Batch operation: paste mobile numbers separated by comma or new line, or select table rows below." />
      <div className="grid content-center gap-2 sm:grid-cols-2 lg:grid-cols-1"><button disabled={!targetIds.length || tab !== 'INVENTORY'} onClick={() => setSoldOpen(true)} className="h-10 rounded-xl bg-success px-4 text-sm font-black text-white disabled:opacity-40">Mark Sold ({targetIds.length})</button><button disabled={!targetIds.length} onClick={() => setDeleteOpen(true)} className="h-10 rounded-xl bg-destructive px-4 text-sm font-black text-white disabled:opacity-40">Delete ({targetIds.length})</button></div>
    </Panel>}
    {loading ? <Loader label="Loading dealer inventory" variant="table" /> : items.length ? <Table head={['Select','Number','Dealer','Type','Purchase','Sale / Intended','Date / Reason','Actions']} pagination={{ page, pageSize, total, onPageChange: setPage, onPageSizeChange: (size) => { setPageSize(size); setPage(1); } }}>
      {items.map((item) => <tr key={item.dealer_purchase_id} className="border-b">
        <td className="px-4 py-3"><input type="checkbox" checked={selected.includes(item.dealer_purchase_id)} onChange={(e) => setSelected((current) => e.target.checked ? [...current,item.dealer_purchase_id] : current.filter((id) => id !== item.dealer_purchase_id))} /></td>
        <td className="px-4 py-3 font-black">{item.display_number}</td><td className="px-4 py-3 font-bold">{item.dealer_name}</td>
        <td className="px-4 py-3"><StatusBadge status={item.visibility_type} /><div className="mt-1 text-[10px] font-black text-muted-foreground">{item.rtp_status === 'NON_RTP' ? 'NON-RTP · PRE-BOOK' : item.rtp_status === 'RTA' ? 'RTA · ACTIVATE' : 'RTP · PORT'}</div></td><td className="px-4 py-3"><Money value={item.purchase_price} /></td>
        <td className="px-4 py-3"><Money value={tab === 'SOLD' ? Number(item.actual_sale_price || 0) : item.intended_sale_price} />{tab === 'SOLD' && <div className={`text-xs font-bold ${Number(item.profit) < 0 ? 'text-destructive' : 'text-success'}`}>Profit {Number(item.profit || 0).toLocaleString('en-IN',{style:'currency',currency:'INR'})}</div>}</td>
        <td className="px-4 py-3 text-xs text-muted-foreground">{tab === 'SOLD' ? item.sold_at ? new Date(item.sold_at).toLocaleString('en-IN') : '-' : tab === 'DELETED' ? <><b className="text-foreground">{item.deleted_reason}</b><br />{item.deleted_at ? new Date(item.deleted_at).toLocaleString('en-IN') : ''}</> : 'In stock'}</td>
        <td className="px-4 py-3">{tab === 'SOLD' ? <button onClick={() => reverse(item.dealer_purchase_id)} className="inline-flex h-9 items-center gap-1 rounded-xl border border-border px-3 text-xs font-black"><Undo2 className="h-3.5 w-3.5" /> Reverse</button> : tab === 'DELETED' ? <button onClick={() => restore(item.dealer_purchase_id)} className="inline-flex h-9 items-center gap-1 rounded-xl border border-border px-3 text-xs font-black"><RotateCcw className="h-3.5 w-3.5" /> Restore</button> : <button onClick={() => { setSelected([item.dealer_purchase_id]); setDeleteOpen(true); }} className="grid h-9 w-9 place-items-center rounded-xl bg-destructive/10 text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>}</td>
      </tr>)}
    </Table> : <EmptyState title={`No ${tab.toLowerCase()} records`} subtitle="Records matching the selected dealer and search will appear here." />}

    <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Dealer Purchase" wide><div className="grid gap-4">
      <label className="grid gap-1 text-sm font-black">Mobile numbers<textarea value={form.numbers} onChange={(e) => setForm({ ...form, numbers: e.target.value })} className="min-h-24 rounded-xl border border-border bg-background p-3 font-medium" placeholder="9876543210, 9988776655" /></label>
      <Combobox label="Search dealer by name, email or phone" items={dealers} value={form.external_dealer_id} onChange={(value) => setForm({ ...form, external_dealer_id: value })} getKey={(dealer) => String(dealer.external_dealer_id)} getLabel={(dealer) => dealer.name + ' · ' + (dealer.email || dealer.phone || '#' + dealer.dealer_user_id)} filterItem={(dealer, query) => [dealer.name, dealer.email, dealer.phone].some((value) => value?.toLowerCase().includes(query.toLowerCase()))} emptyText="No dealer accounts found." footer={(close) => <Link onClick={close} to="/admin/dealers/new?returnTo=purchases" className="flex items-center gap-2 border-t border-border px-3 py-3 text-sm font-bold text-primary"><Plus className="h-4 w-4" />Create new dealer</Link>} />
      <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm font-black">Stock visibility<ThemedSelect value={form.visibility_type} onChange={(e) => setForm({ ...form, visibility_type: e.target.value, private_link_ids: [] })} className="h-11 rounded-xl border border-border bg-background px-3"><option value="ONLINE">Online · Public</option><option value="OFFLINE">Offline · Private</option></ThemedSelect></label><label className="grid gap-1 text-sm font-black">Porting / activation readiness<ThemedSelect value={form.rtp_status} onChange={(e) => setForm({ ...form, rtp_status: e.target.value, rtp_available_date: e.target.value === 'NON_RTP' ? form.rtp_available_date : '' })} className="h-11 rounded-xl border border-border bg-background px-3"><option value="RTP">RTP · Ready to port</option><option value="NON_RTP">NON-RTP · Pre-book</option><option value="RTA">RTA · Ready to activate</option></ThemedSelect></label></div>
      {form.rtp_status === 'RTA' && <label className="grid gap-1 text-sm font-black">Serviceable PIN codes<textarea className="rounded-xl border border-border bg-background px-3 py-2 text-sm" value={form.serviceable_pin_codes} onChange={event => setForm({ ...form, serviceable_pin_codes: event.target.value })} placeholder="400001, 400002" /></label>}
      {form.rtp_status === 'NON_RTP' && <label className="grid gap-1 text-sm font-black">Ready-to-port date (India)<input required type="date" min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)} value={form.rtp_available_date} onChange={(e) => setForm({ ...form, rtp_available_date: e.target.value })} className="h-11 rounded-xl border border-border bg-background px-3" /></label>}
      <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm font-black">Purchase price<input type="number" min="0" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} className="h-11 rounded-xl border border-border bg-background px-3" /></label><label className="grid gap-1 text-sm font-black">Base price (₹)<input type="number" min="0.01" step="0.01" value={form.intended_sale_price} onChange={(e) => setForm({ ...form, intended_sale_price: e.target.value })} className="h-11 rounded-xl border border-border bg-background px-3" /></label></div>
      <label className="grid gap-1 text-sm font-black">Additional discount (%)<input type="number" min="0" max="99.99" step="0.01" value={form.additional_discount_pct} placeholder="0" onChange={e => setForm({ ...form, additional_discount_pct: e.target.value })} className="h-11 rounded-xl border border-border bg-background px-3" /></label>
      <NumberPricingPreview base={form.intended_sale_price} additional={form.additional_discount_pct} />
      {form.visibility_type === 'OFFLINE' && <p className="text-xs text-muted-foreground">This stock appears through the single Offline catalog link.</p>}
      <button disabled={busy} onClick={createPurchases} className="h-11 rounded-xl bg-primary font-black text-primary-foreground disabled:opacity-50">{busy ? 'Adding…' : 'Add Purchase'}</button>
    </div></Modal>
    <Modal open={paymentOpen} onClose={() => setPaymentOpen(false)} title="Record Dealer Payment"><div className="grid gap-4">
      <Combobox label="Search dealer by name, email or phone" items={dealers} value={payment.external_dealer_id} onChange={(value) => setPayment({ ...payment, external_dealer_id: value })} getKey={(dealer) => String(dealer.external_dealer_id)} getLabel={(dealer) => dealer.name + ' · ' + (dealer.email || dealer.phone || '#' + dealer.dealer_user_id)} filterItem={(dealer, query) => [dealer.name, dealer.email, dealer.phone].some((value) => value?.toLowerCase().includes(query.toLowerCase()))} renderOption={(dealer) => <><span>{dealer.name} · {dealer.email || dealer.phone}</span><span className="block text-xs text-muted-foreground">Remaining ₹{Number(dealer.amount_remaining).toLocaleString('en-IN')}</span></>} emptyText="No dealer accounts found." footer={(close) => <Link onClick={close} to="/admin/dealers/new?returnTo=purchases" className="flex items-center gap-2 border-t border-border px-3 py-3 text-sm font-bold text-primary"><Plus className="h-4 w-4" />Create new dealer</Link>} />
      <label className="grid gap-1 text-sm font-black">Amount<input type="number" min="1" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })} className="h-11 rounded-xl border border-border bg-background px-3" /></label>
      <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm font-black">Method<ThemedSelect value={payment.payment_method} onChange={(e) => setPayment({ ...payment, payment_method: e.target.value })} className="h-11 rounded-xl border border-border bg-background px-3"><option>BANK_TRANSFER</option><option>UPI</option><option>CASH</option><option>CHEQUE</option></ThemedSelect></label><label className="grid gap-1 text-sm font-black">Paid at<input type="datetime-local" value={payment.paid_at} onChange={(e) => setPayment({ ...payment, paid_at: e.target.value })} className="h-11 rounded-xl border border-border bg-background px-3" /></label></div>
      <input value={payment.reference_no} onChange={(e) => setPayment({ ...payment, reference_no: e.target.value })} className="h-11 rounded-xl border border-border bg-background px-3" placeholder="Reference number (optional)" /><textarea value={payment.notes} onChange={(e) => setPayment({ ...payment, notes: e.target.value })} className="min-h-20 rounded-xl border border-border bg-background p-3" placeholder="Notes (optional)" />
      <button disabled={busy} onClick={recordPayment} className="h-11 rounded-xl bg-primary font-black text-primary-foreground">Record Payment</button>
    </div></Modal>
    <Modal open={soldOpen} onClose={() => setSoldOpen(false)} title="Mark Selected Numbers Sold"><div className="grid gap-4"><p className="text-sm text-muted-foreground">Actual price is optional for a batch. When blank, each number uses its intended sale price.</p><label className="grid gap-1 text-sm font-black">Actual sale price<input type="number" min="1" value={sale.actual_sale_price} onChange={(e) => setSale({ ...sale, actual_sale_price: e.target.value })} className="h-11 rounded-xl border border-border bg-background px-3" /></label><label className="grid gap-1 text-sm font-black">Sale date<input type="datetime-local" value={sale.sold_at} onChange={(e) => setSale({ ...sale, sold_at: e.target.value })} className="h-11 rounded-xl border border-border bg-background px-3" /></label><button disabled={busy} onClick={markSold} className="h-11 rounded-xl bg-success font-black text-white">Mark {targetIds.length} Sold</button></div></Modal>
    <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Dealer Numbers"><div className="grid gap-4"><p className="text-sm text-muted-foreground">This is recoverable and moves records to Dealer Deletes.</p><textarea value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-24 rounded-xl border border-border bg-background p-3" placeholder="Required reason" /><button disabled={busy || reason.trim().length < 5} onClick={deleteRows} className="h-11 rounded-xl bg-destructive font-black text-white disabled:opacity-50">Delete {targetIds.length} Records</button></div></Modal>
    <Modal open={paymentsOpen} onClose={() => setPaymentsOpen(false)} title="Dealer Payment History" extraWide><div className="grid gap-3">
      {payments.length ? <Table head={['Dealer','Amount','Method','Reference','Paid at','Status','Action']} pagination={{ page: paymentPage, pageSize: paymentPageSize, total: paymentTotal, onPageChange: setPaymentPage, onPageSizeChange: (size) => { setPaymentPageSize(size); setPaymentPage(1); } }}>{payments.map((row) => <tr key={row.dealer_payment_id} className="border-b"><td className="px-4 py-3 font-black">{row.dealer_name}</td><td className="px-4 py-3"><Money value={row.amount} /></td><td className="px-4 py-3 text-sm">{row.payment_method || '-'}</td><td className="px-4 py-3 text-sm">{row.reference_no || '-'}</td><td className="px-4 py-3 text-xs">{new Date(row.paid_at).toLocaleString('en-IN')}</td><td className="px-4 py-3"><StatusBadge status={row.status} />{row.void_reason && <div className="mt-1 text-xs text-destructive">{row.void_reason}</div>}</td><td className="px-4 py-3">{row.status === 'POSTED' && <button onClick={() => { setReason(''); setVoidPaymentId(row.dealer_payment_id); }} className="rounded-xl bg-destructive/10 px-3 py-2 text-xs font-black text-destructive">Void</button>}</td></tr>)}</Table> : <EmptyState title="No payments recorded" />}
    </div></Modal>
    <Modal open={Boolean(voidPaymentId)} onClose={() => setVoidPaymentId(null)} title="Void Dealer Payment"><div className="grid gap-4"><p className="text-sm text-muted-foreground">The payment remains in the audit history and stops contributing to Total Paid.</p><textarea value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-24 rounded-xl border border-border bg-background p-3" placeholder="Required void reason" /><button disabled={busy || reason.trim().length < 5} onClick={voidPayment} className="h-11 rounded-xl bg-destructive font-black text-white disabled:opacity-50">Void Payment</button></div></Modal>
  </div>;
}
