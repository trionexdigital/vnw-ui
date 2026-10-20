import { useEffect, useState } from 'react';
import { dm, downloadWorkbook, fileBase64, type ModulePage } from '@/core/api/dealerManagement';
import { Button, DealerSelect, ErrorMessage, Field, Readiness, Stats, dateInput, localDate, rupee, previewProfit, useMutation } from '../../dealerManagement/components';
export function DealerForm({
  dealer,
  admin,
  onDone
}: {
  dealer?: any;
  admin: boolean;
  onDone: () => void;
}) {
  const [form, setForm] = useState<any>(dealer ? {
    ...dealer,
    linked_user_id: dealer.linked_user_id || '',
    reason: ''
  } : {
    dealer_type: 'BASIC',
    name: '',
    contact_name: '',
    phone: '',
    email: '',
    status: 'ACTIVE',
    linked_user_id: '',
    create_account: false,
    password: ''
  });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountQuery, setAccountQuery] = useState('');
  const action = useMutation(onDone);
  const set = (key: string, value: any) => setForm((old: any) => ({
    ...old,
    [key]: value
  }));
  const findAccounts = async () => {
    try {
      setAccounts(await dm('accounts', {
        q: accountQuery
      }));
    } catch (e: any) {
      action.setError(e.message);
    }
  };
  return <form className="dm-form" onSubmit={e => {
    e.preventDefault();
    const payload = {
      ...form
    };
    if (!admin) {
      delete payload.linked_user_id;
      delete payload.create_account;
      delete payload.password;
    }
    void action.run('dealerSave', payload);
  }}>
    <div className="dm-grid">
      <Field label="Dealer type"><select value={form.dealer_type} disabled={!!dealer} onChange={e => set('dealer_type', e.target.value)}><option value="BASIC">Basic</option><option value="PREMIUM">Premium</option></select></Field>
      <Field label="Status"><select value={form.status} onChange={e => set('status', e.target.value)}><option value="ACTIVE">Active</option><option value="BLOCKED">Blocked</option></select></Field>
      <Field label="Dealer / group name"><input required maxLength={128} value={form.name} onChange={e => set('name', e.target.value)} /></Field>
      <Field label="Contact person"><input required maxLength={96} value={form.contact_name} onChange={e => set('contact_name', e.target.value)} /></Field>
      <Field label="Mobile number"><input required type="tel" maxLength={20} value={form.phone} onChange={e => set('phone', e.target.value)} /></Field>
      <Field label="Email"><input required type="email" maxLength={128} value={form.email} onChange={e => set('email', e.target.value)} /></Field>
    </div>
    {admin && <div className="dm-panel dm-form">
      <h2>Statement login</h2><p className="text-xs text-muted-foreground">Linking grants access to this module statement. Existing account roles and website access remain unchanged.</p>
      <label className="flex gap-2 text-xs"><input type="checkbox" checked={!!form.create_account} onChange={e => {
          set('create_account', e.target.checked);
          set('linked_user_id', '');
        }} /> Create a new customer login</label>
      {form.create_account ? <Field label="Initial password"><input required minLength={8} maxLength={128} type="password" autoComplete="new-password" value={form.password} onChange={e => set('password', e.target.value)} /></Field> : <>
        <div className="dm-actions"><input aria-label="Find login account" placeholder="Search account by name or email" value={accountQuery} onChange={e => setAccountQuery(e.target.value)} /><Button onClick={findAccounts}>Find accounts</Button></div>
        <Field label="Linked login"><select value={form.linked_user_id} onChange={e => set('linked_user_id', e.target.value)}><option value="">No linked account</option>{form.linked_user_id && !accounts.some(a => String(a.user_id) === String(form.linked_user_id)) && <option value={form.linked_user_id}>Current account #{form.linked_user_id}</option>}{accounts.map(a => <option key={a.user_id} value={a.user_id}>{a.full_name} · {a.email} · {a.role}</option>)}</select></Field>
      </>}
    </div>}
    {dealer && <Field label="Reason for change"><textarea required minLength={5} maxLength={1000} value={form.reason} onChange={e => set('reason', e.target.value)} /></Field>}
    <ErrorMessage error={action.error} /><Button primary type="submit" disabled={action.busy}>{action.busy ? 'Saving…' : dealer ? 'Save dealer' : 'Create dealer'}</Button>
  </form>;
}
export function StockForm({
  dealers,
  dealerId,
  onDone
}: {
  dealers: any[];
  dealerId: string;
  onDone: () => void;
}) {
  const [form, setForm] = useState<any>({
    dealer_id: dealerId,
    number_value: '',
    dealer_cost: '',
    selling_price: '',
    readiness: 'RTP',
    rtp_date: '',
    remarks: ''
  });
  const action = useMutation(onDone);
  const set = (key: string, value: string) => setForm((old: any) => ({
    ...old,
    [key]: value
  }));
  return <form className="dm-form" onSubmit={e => {
    e.preventDefault();
    void action.run('stockAdd', {
      rows: form.number_value.split(/[\s,]+/).filter(Boolean).map((number: string) => ({
        ...form,
        number_value: number
      }))
    });
  }}>
    <Field label="Dealer"><DealerSelect dealers={dealers} value={form.dealer_id} onChange={v => set('dealer_id', v)} /></Field>
    <Field label="Mobile numbers"><textarea required placeholder="One or more 10-digit numbers, separated by commas or new lines" value={form.number_value} onChange={e => set('number_value', e.target.value)} /></Field>
    <div className="dm-grid"><Field label="Dealer cost (₹)"><input required type="number" min="0.01" step="0.01" value={form.dealer_cost} onChange={e => set('dealer_cost', e.target.value)} /></Field><Field label="Selling price (₹)"><input required type="number" min="0.01" step="0.01" value={form.selling_price} onChange={e => set('selling_price', e.target.value)} /></Field><Field label="Readiness"><Readiness value={form.readiness} onChange={v => set('readiness', v)} /></Field>{form.readiness === 'NON_RTP' && <Field label="RTP availability date"><input required type="date" value={form.rtp_date} onChange={e => set('rtp_date', e.target.value)} /></Field>}</div>
    <Field label="Remarks"><textarea maxLength={1000} value={form.remarks} onChange={e => set('remarks', e.target.value)} /></Field><p className="dm-notice">Prices are independent of website pricing. Numbers remain exclusively in this module.</p><ErrorMessage error={action.error} /><Button primary type="submit" disabled={action.busy}>{action.busy ? 'Adding…' : 'Add module stock'}</Button>
  </form>;
}
export function ImportForm({
  dealerId,
  onDone
}: {
  dealerId: string;
  onDone: () => void;
}) {
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const action = useMutation(onDone);
  const analyze = async (file?: File) => {
    if (!file) return;
    setLoading(true);
    setPreview(null);
    action.setError('');
    try {
      setPreview(await dm('importPreview', {
        dealer_id: dealerId || undefined,
        content_base64: await fileBase64(file)
      }));
    } catch (e: any) {
      action.setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const template = () => {
    const csv = 'dealer_id,number_value,dealer_cost,selling_price,readiness,rtp_date,remarks\r\n';
    const link = document.createElement('a');
    const url = URL.createObjectURL(new Blob([csv], {
      type: 'text/csv'
    }));
    link.href = url;
    link.download = 'standalone-dealer-template.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <div className="dm-form"><p className="text-xs text-muted-foreground">CSV or XLSX, up to 1,000 numbers / 5 MB. Use ISO dates (YYYY-MM-DD). Commit revalidates every row; any error rolls back the complete batch.</p><Button onClick={template}>Download CSV template</Button><Field label="Choose file"><input type="file" accept=".csv,.xlsx" disabled={loading || action.busy} onChange={e => void analyze(e.target.files?.[0])} /></Field>{loading && <p role="status">Validating file…</p>}{preview && <><p>{preview.ready} of {preview.total} rows ready</p><div className="dm-table-wrap max-h-72"><table className="dm-table"><thead><tr><th>Row</th><th>Number</th><th>Validation</th></tr></thead><tbody>{preview.rows.map((row: any) => <tr key={row.row}><td>{row.row}</td><td translate="no">{row.values.number_value}</td><td>{row.error || 'Ready'}</td></tr>)}</tbody></table></div><Button primary disabled={action.busy || preview.ready !== preview.total} onClick={() => void action.run('importCommit', {
        rows: preview.rows.map((r: any) => r.values)
      })}>{action.busy ? 'Importing…' : 'Import validated numbers'}</Button></>}<ErrorMessage error={action.error} /></div>;
}
export function BulkForm({
  rows,
  dealers,
  can,
  onDone
}: {
  rows: any[];
  dealers: any[];
  can: (permission: string) => boolean;
  onDone: () => void;
}) {
  const [field, setField] = useState('readiness');
  const [value, setValue] = useState('RTP');
  const [rtpDate, setRtpDate] = useState('');
  const [why, setWhy] = useState('');
  const action = useMutation(onDone);
  return <form className="dm-form" onSubmit={e => {
    e.preventDefault();
    const changes: any = {
      [field]: value
    };
    if (field === 'readiness' && value === 'NON_RTP') changes.rtp_date = rtpDate;
    void action.run('stockBulk', {
      stock_ids: rows.map(r => r.stock_id),
      versions: Object.fromEntries(rows.map(r => [r.stock_id, r.version])),
      changes,
      reason: why
    });
  }}>
    <p className="dm-notice">{rows.length} selected records. All changes save together. Sold records retain their historical sale values.</p>
    <Field label="Change field"><select value={field} onChange={e => {
        setField(e.target.value);
        setValue(e.target.value === 'readiness' ? 'RTP' : e.target.value === 'state' ? 'INACTIVE' : '');
      }}><option value="readiness">Readiness</option><option value="rtp_date">RTP date</option><option value="state">Deactivate / reactivate</option>{can('stock.price') && <><option value="dealer_cost">Dealer cost</option><option value="selling_price">Selling price</option></>}{can('stock.dealer') && <option value="dealer_id">Dealer</option>}</select></Field>
    <Field label="New value">{field === 'readiness' ? <Readiness value={value} onChange={setValue} /> : field === 'dealer_id' ? <DealerSelect dealers={dealers} value={value} onChange={setValue} /> : field === 'state' ? <select value={value} onChange={e => setValue(e.target.value)}><option value="INACTIVE">Inactive</option><option value="INVENTORY">Live inventory</option></select> : <input required type={field === 'rtp_date' ? 'date' : 'number'} min={field === 'rtp_date' ? undefined : '0.01'} step="0.01" value={value} onChange={e => setValue(e.target.value)} />}</Field>
    {field === 'readiness' && value === 'NON_RTP' && <Field label="RTP availability date"><input required type="date" value={rtpDate} onChange={e => setRtpDate(e.target.value)} /></Field>}
    <Field label="Reason"><textarea required minLength={5} value={why} onChange={e => setWhy(e.target.value)} /></Field><ErrorMessage error={action.error} /><Button primary type="submit" disabled={action.busy}>Apply to selected numbers</Button>
  </form>;
}
export function SaleForm({
  stock,
  onDone
}: {
  stock: any;
  onDone: () => void;
}) {
  const [form, setForm] = useState<any>({
    stock_id: stock.stock_id,
    version: stock.version,
    sale_price: stock.selling_price,
    charges: '0.00',
    sale_source: 'OFFLINE',
    sold_at: localDate(),
    external_reference: '',
    confirm_loss: false
  });
  const action = useMutation(onDone);
  const set = (k: string, v: any) => setForm((old: any) => ({
    ...old,
    [k]: v
  }));
  const profit = previewProfit(stock.dealer_cost, form.sale_price, form.charges);
  return <form className="dm-form" onSubmit={e => {
    e.preventDefault();
    void action.run('sell', form);
  }}><p translate="no" className="text-xl font-black">{stock.number_value}</p><Stats values={[["Locked dealer cost", stock.dealer_cost, true], ["Net profit", profit, true]]} /><div className="dm-grid"><Field label="Customer sale price (₹)"><input required type="number" min="0.01" step="0.01" value={form.sale_price} onChange={e => set('sale_price', e.target.value)} /></Field><Field label="Charges (₹)"><input required type="number" min="0" step="0.01" value={form.charges} onChange={e => set('charges', e.target.value)} /></Field><Field label="Sale source"><select value={form.sale_source} onChange={e => set('sale_source', e.target.value)}><option value="OFFLINE">Offline</option><option value="ONLINE">Online (record only)</option></select></Field><Field label="Sale date and time"><input required type="datetime-local" value={form.sold_at} onChange={e => set('sold_at', e.target.value)} /></Field></div><Field label="External order / payment reference"><input maxLength={128} value={form.external_reference} onChange={e => set('external_reference', e.target.value)} /></Field>{profit?.startsWith('-') && <label className="dm-error flex gap-2"><input required type="checkbox" checked={form.confirm_loss} onChange={e => set('confirm_loss', e.target.checked)} />I confirm the displayed loss of {rupee(profit.slice(1))}.</label>}<p className="dm-notice">Confirm only after customer payment is received. This records a sale and creates a dealer payable; it does not process a website order or money transfer.</p><ErrorMessage error={action.error} /><Button primary type="submit" disabled={action.busy}>Confirm sale</Button></form>;
}
export function CorrectionForm({
  sale,
  dealers,
  cancel = false,
  onDone
}: {
  sale: any;
  dealers: any[];
  cancel?: boolean;
  onDone: () => void;
}) {
  const [form, setForm] = useState<any>({
    sale_id: sale.sale_id,
    version: sale.version,
    dealer_id: sale.dealer_id,
    number_value: sale.number_value,
    dealer_cost: sale.dealer_cost,
    sale_price: sale.sale_price,
    charges: sale.charges,
    sale_source: sale.sale_source,
    sold_at: dateInput(sale.sold_at),
    external_reference: sale.external_reference,
    reason: '',
    confirm_loss: false
  });
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const action = useMutation(onDone);
  const set = (k: string, v: any) => {
    setPreview(null);
    setForm((old: any) => ({
      ...old,
      [k]: v
    }));
  };
  const showPreview = async () => {
    setLoading(true);
    try {
      setPreview(await dm('salePreview', form));
      action.setError('');
    } catch (e: any) {
      action.setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  return <form className="dm-form" onSubmit={e => {
    e.preventDefault();
    if (cancel) void action.run('saleCancel', form);else if (preview) void action.run('saleCorrect', {
      ...form,
      confirm_impact: true
    });else void showPreview();
  }}>
    <p className="dm-notice">{cancel ? sale.settled_payment_id ? 'This paid sale will be cancelled and a recovery will be carried to future settlements.' : 'This unpaid sale will be cancelled and its payable reversed.' : 'Correction cancels the old sale and creates a replacement snapshot. Original payment records are retained. A paid original creates a recovery.'}</p>
    {!cancel && <><Field label="Dealer"><DealerSelect dealers={dealers} value={String(form.dealer_id)} onChange={v => set('dealer_id', v)} /></Field><Field label="Number"><input required maxLength={10} value={form.number_value} onChange={e => set('number_value', e.target.value)} /></Field><div className="dm-grid">{[['dealer_cost', 'Dealer cost (₹)'], ['sale_price', 'Sale price (₹)'], ['charges', 'Charges (₹)']].map(([key, label]) => <Field key={key} label={label}><input required type="number" min={key === 'charges' ? '0' : '0.01'} step="0.01" value={form[key]} onChange={e => set(key, e.target.value)} /></Field>)}<Field label="Sold at"><input required type="datetime-local" value={form.sold_at} onChange={e => set('sold_at', e.target.value)} /></Field></div><Field label="Sale source"><select value={form.sale_source} onChange={e => set('sale_source', e.target.value)}><option value="OFFLINE">Offline</option><option value="ONLINE">Online</option></select></Field><Field label="External reference"><input value={form.external_reference} maxLength={128} onChange={e => set('external_reference', e.target.value)} /></Field>{previewProfit(form.dealer_cost, form.sale_price, form.charges)?.startsWith('-') && <label className="flex gap-2 text-xs"><input required type="checkbox" checked={form.confirm_loss} onChange={e => set('confirm_loss', e.target.checked)} />Confirm this loss-making correction.</label>}</>}
    <Field label="Reason"><textarea required minLength={5} maxLength={1000} value={form.reason} onChange={e => set('reason', e.target.value)} /></Field>
    {preview && <Stats values={[["Payable change", preview.payable_change, true], ["Profit change", preview.profit_change, true], ["Replacement payable", preview.dealer_cost, true]]} />}
    <ErrorMessage error={action.error} /><Button primary danger={cancel} type="submit" disabled={action.busy || loading}>{loading ? 'Calculating…' : cancel ? 'Confirm cancellation' : preview ? 'Confirm correction' : 'Review financial impact'}</Button>
  </form>;
}
export function PaymentForm({
  dealerId,
  onDone
}: {
  dealerId: string;
  onDone: (result?: any) => void;
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [target, setTarget] = useState('');
  const [suggestions, setSuggestions] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({
    dealer_id: dealerId,
    payment_mode: 'BANK',
    reference_no: '',
    paid_at: localDate(),
    notes: ''
  });
  const action = useMutation();
  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const all: any[] = [];
      let page = 1;
      while (all.length < 1000) {
        const result = await dm<ModulePage>('sales', {
          dealer_id: dealerId,
          status: 'ACTIVE',
          settlement: 'PENDING',
          limit: 100,
          page
        });
        all.push(...result.items);
        if (all.length >= result.total || !result.items.length) break;
        page++;
      }
      if (active) setRows(all);
    })().catch(e => {
      if (active) action.setError(e.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [dealerId]);
  const read = async (actionName: string, payload: any) => {
    setLoading(true);
    action.setError('');
    try {
      return await dm(actionName, payload);
    } catch (e: any) {
      action.setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const set = (k: string, v: any) => setForm((old: any) => ({
    ...old,
    [k]: v
  }));
  const choose = (list: number[]) => {
    setSelected(list);
    setPreview(null);
  };
  return <div className="dm-form"><p className="dm-notice">Select complete unpaid numbers. This records a payment already made; it does not transfer money. Up to 1,000 pending numbers are shown.</p>
    <div className="dm-actions"><input aria-label="Target payment amount" type="number" min="0.01" step="0.01" placeholder="Target amount (₹)" value={target} onChange={e => setTarget(e.target.value)} /><Button disabled={loading || !target} onClick={async () => {
        const result = await read('suggest', {
          dealer_id: dealerId,
          target
        });
        if (result) setSuggestions(result);
      }}>Find combinations</Button></div>
    {suggestions && <div className="dm-notice"><p>{suggestions.exact ? 'Exact combination found' : suggestions.bounded ? 'Best combinations found (search limit reached)' : 'Nearest available combinations'}</p><div className="dm-actions">{suggestions.suggestions.map((s: any) => <Button key={s.total} onClick={() => choose(s.sale_ids)}>{rupee(s.total)} · {s.sale_ids.length} numbers · difference {rupee(s.difference)}</Button>)}</div></div>}
    {loading && <p role="status">Loading payment details…</p>}
    <div className="dm-table-wrap max-h-72"><table className="dm-table"><thead><tr><th><input aria-label="Select all pending numbers" type="checkbox" checked={!!rows.length && selected.length === rows.length} onChange={e => choose(e.target.checked ? rows.map(r => r.sale_id) : [])} /></th><th>Number</th><th>Dealer payable</th></tr></thead><tbody>{rows.map(row => <tr key={row.sale_id}><td><input aria-label={`Select ${row.number_value}`} type="checkbox" checked={selected.includes(row.sale_id)} onChange={e => choose(e.target.checked ? [...selected, row.sale_id] : selected.filter(v => v !== row.sale_id))} /></td><td translate="no">{row.number_value}</td><td translate="no">{rupee(row.dealer_cost)}</td></tr>)}</tbody></table>{!rows.length && !loading && <p className="p-4 text-sm">No pending sold numbers.</p>}</div>
    <Button disabled={loading || !selected.length} onClick={async () => {
      const result = await read('paymentPreview', {
        dealer_id: dealerId,
        sale_ids: selected
      });
      if (result) setPreview(result);
    }}>Review {selected.length} selected numbers</Button>
    {preview && <form className="dm-form" onSubmit={async e => {
      e.preventDefault();
      const result = await action.run('paymentRecord', {
        ...form,
        sale_ids: selected,
        gross_amount: preview.gross_amount,
        recovery_amount: preview.recovery_amount,
        net_amount: preview.net_amount
      });
      if (result) onDone(result);
    }}>
      <Stats values={[["Numbers cleared", preview.gross_amount, true], ["Recovery deducted", preview.recovery_amount, true], ["Net payment", preview.net_amount, true]]} />
      <div className="dm-grid"><Field label="Payment mode"><select value={form.payment_mode} onChange={e => set('payment_mode', e.target.value)}>{['UPI', 'BANK', 'CASH', 'OTHER'].map(v => <option key={v}>{v}</option>)}</select></Field><Field label="UTR / reference"><input required={['UPI', 'BANK'].includes(form.payment_mode)} maxLength={128} value={form.reference_no} onChange={e => set('reference_no', e.target.value)} /></Field><Field label="Paid at"><input required type="datetime-local" value={form.paid_at} onChange={e => set('paid_at', e.target.value)} /></Field></div><Field label="Notes"><textarea maxLength={1000} value={form.notes} onChange={e => set('notes', e.target.value)} /></Field><Button primary type="submit" disabled={action.busy || loading}>{action.busy ? 'Recording…' : 'Confirm recorded payment'}</Button>
    </form>}<ErrorMessage error={action.error} />
  </div>;
}
export function VoidPaymentForm({
  payment,
  onDone
}: {
  payment: any;
  onDone: () => void;
}) {
  const [why, setWhy] = useState('');
  const action = useMutation(onDone);
  return <form className="dm-form" onSubmit={e => {
    e.preventDefault();
    void action.run('paymentVoid', {
      payment_id: payment.payment_id,
      reason: why
    });
  }}><p className="dm-notice">Reverse {payment.payment_code}. Original allocations remain in history. Active sales return to Pending, and any recovery deductions become available again.</p><Field label="Reason"><textarea required minLength={5} value={why} onChange={e => setWhy(e.target.value)} /></Field><ErrorMessage error={action.error} /><Button danger type="submit" disabled={action.busy}>Confirm payment reversal</Button></form>;
}
export function Receipt({
  receipt
}: {
  receipt: any;
}) {
  const p = receipt.payment;
  let phone = String(p.phone).replace(/\D/g, '');
  if (phone.length === 10) phone = '91' + phone;
  const message = ['VIP Number World', `Dealer: ${p.dealer_code} · ${p.name}`, `Payment: ${p.payment_code} (${p.status})`, `Net payment: ${rupee(p.net_amount)}`, `Numbers cleared: ${receipt.numbers.length}`, ...receipt.numbers.map((n: any) => `${n.number_value} — ${rupee(n.amount)}`), `Gross cleared: ${rupee(p.gross_amount)}`, `Recovery deducted: ${rupee(p.recovery_amount)}`, `Mode: ${p.payment_mode}`, `Reference: ${p.reference_no || '—'}`, `Date: ${p.paid_at}`, `Remaining pending: ${receipt.pending.number_count} numbers · ${rupee(receipt.pending.amount)}`].join('\n');
  return <><div className="dm-receipt"><h2 className="text-xl font-black">VIP Number World</h2><p>Dealer settlement receipt</p><p translate="no">{p.payment_code} · {p.status}</p><hr className="my-3" /><p translate="no">{p.dealer_code} · {p.name}</p><p translate="no">{p.paid_at} · {p.payment_mode} · {p.reference_no || '—'}</p><p translate="no">Recorded by: {p.staff_name} (#{p.created_by})</p><Stats values={[["Gross cleared", p.gross_amount, true], ["Recovery", p.recovery_amount, true], ["Net payment", p.net_amount, true]]} /><table className="dm-table"><thead><tr><th>Number</th><th>Full dealer amount</th></tr></thead><tbody>{receipt.numbers.map((n: any) => <tr key={n.sale_id}><td translate="no">{n.number_value}</td><td translate="no">{rupee(n.amount)}</td></tr>)}</tbody></table>{receipt.recovery_allocations?.length > 0 && <><h3 className="mt-4 font-bold">Recovery deductions</h3>{receipt.recovery_allocations.map((r: any) => <p key={r.adjustment_id}>#{r.adjustment_id} · {rupee(r.amount)} · <span translate="no">{r.reason}</span></p>)}</>}<p className="mt-4">Remaining pending: {receipt.pending.number_count} numbers · {rupee(receipt.pending.amount)}</p>{p.notes && <p translate="no">{p.notes}</p>}</div><div className="dm-actions dm-no-print"><Button onClick={() => window.print()}>Print / save PDF</Button><a className="dm-button dm-button-primary" href={`https://wa.me/${phone}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">Share on WhatsApp</a></div></>;
}
export function StaffForm() {
  const [data, setData] = useState<any>(null);
  const [target, setTarget] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [why, setWhy] = useState('');
  const action = useMutation();
  const load = () => dm('staff').then(setData).catch(e => action.setError(e.message));
  useEffect(() => {
    void load();
  }, []);
  if (!data) return <><p>Loading module permissions…</p><ErrorMessage error={action.error} /></>;
  return <form className="dm-form" onSubmit={async e => {
    e.preventDefault();
    const result = await action.run('staffSave', {
      target_id: target,
      permissions,
      reason: why
    });
    if (result) {
      await load();
      setWhy('');
    }
  }}><p className="dm-notice">Permissions apply only to this module. Employees start with no access; website permissions are unchanged.</p><Field label="Employee"><select required value={target} onChange={e => {
        setTarget(e.target.value);
        setPermissions(data.grants.filter((g: any) => String(g.user_id) === e.target.value).map((g: any) => g.permission_key));
      }}><option value="">Choose employee</option>{data.users.map((u: any) => <option key={u.user_id} value={u.user_id}>{u.full_name} · {u.email}</option>)}</select></Field><div className="dm-grid">{data.permissions.map((key: string) => <label className="flex items-center gap-2 rounded-lg border p-3 text-xs" key={key}><input disabled={!target} type="checkbox" checked={permissions.includes(key)} onChange={e => setPermissions(e.target.checked ? [...permissions, key] : permissions.filter(v => v !== key))} />{key.replaceAll('.', ' · ')}</label>)}</div><Field label="Reason"><textarea required minLength={5} value={why} onChange={e => setWhy(e.target.value)} /></Field><ErrorMessage error={action.error} /><Button primary type="submit" disabled={!target || action.busy}>Save module permissions</Button></form>;
}
