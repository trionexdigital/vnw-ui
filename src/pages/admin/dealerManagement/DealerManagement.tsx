import { useEffect, useState, type ReactNode } from 'react';
import { useAppSelector } from '@/app/hooks';
import { allModuleDealers, dm, downloadWorkbook, type ModuleAccess, type ModulePage } from '@/core/api/dealerManagement';
import Modal from '@/shared/components/Modal';
import { Button, DealerSelect, ErrorMessage, Field, Pager, Readiness, Stats, rupee, useMutation } from '../../dealerManagement/components';
import { BulkForm, CorrectionForm, DealerForm, ImportForm, PaymentForm, Receipt, SaleForm, StaffForm, StockForm, VoidPaymentForm } from './forms';
import DealerStatement from '../../dealerManagement/Statement';
import '../../dealerManagement/module.css';
function StockRow({
  row,
  dealers,
  can,
  onDone,
  onSell,
  onHistory,
  selected,
  onSelect
}: {
  row: any;
  dealers: any[];
  can: (p: string) => boolean;
  onDone: () => void;
  onSell: () => void;
  onHistory: () => void;
  selected: boolean;
  onSelect: (value: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const action = useMutation(() => {
    setEditing(false);
    onDone();
  });
  const start = () => {
    setForm({
      stock_id: row.stock_id,
      version: row.version,
      number_value: row.number_value,
      dealer_id: row.dealer_id,
      dealer_cost: row.dealer_cost,
      selling_price: row.selling_price,
      readiness: row.readiness,
      rtp_date: String(row.rtp_date || '').slice(0, 10),
      remarks: row.remarks,
      reason: ''
    });
    setEditing(true);
  };
  const set = (k: string, v: string) => setForm((old: any) => ({
    ...old,
    [k]: v
  }));
  const patterns = (() => {
    try {
      return JSON.parse(row.patterns_json).join(', ');
    } catch {
      return '';
    }
  })();
  return <><tr><td><input type="checkbox" aria-label={`Select ${row.number_value}`} checked={selected} onChange={e => onSelect(e.target.checked)} /></td><td className="dm-number">{editing ? <input aria-label="Number" disabled={row.state === 'SOLD'} maxLength={10} value={form.number_value} onChange={e => set('number_value', e.target.value)} /> : <span translate="no">{row.number_value}</span>}<small className="block max-w-48 whitespace-normal font-normal text-muted-foreground">Total {row.digit_total} · Root {row.root_sum}<br />{patterns}</small></td><td className="dm-inline">{editing ? <DealerSelect dealers={dealers} value={String(form.dealer_id)} onChange={v => set('dealer_id', v)} disabled={row.state === 'SOLD' || !can('stock.dealer')} /> : <><span translate="no">{row.dealer_code}</span><small className="block" translate="no">{row.dealer_name}</small></>}</td><td className="dm-inline">{editing ? <input aria-label="Dealer cost" type="number" min="0.01" step="0.01" disabled={!can('stock.price')} value={form.dealer_cost} onChange={e => set('dealer_cost', e.target.value)} /> : <span translate="no">{rupee(row.dealer_cost)}</span>}</td><td className="dm-inline">{editing ? <input aria-label="Selling price" type="number" min="0.01" step="0.01" disabled={!can('stock.price')} value={form.selling_price} onChange={e => set('selling_price', e.target.value)} /> : <span translate="no">{rupee(row.selling_price)}</span>}</td><td className="dm-inline">{editing ? <><Readiness value={form.readiness} onChange={v => set('readiness', v)} />{form.readiness === 'NON_RTP' && <input aria-label="RTP date" type="date" value={form.rtp_date} onChange={e => set('rtp_date', e.target.value)} />}</> : <>{row.readiness}<small className="block" translate="no">{row.rtp_date}</small></>}</td><td>{row.state}</td><td className="dm-inline">{editing ? <textarea aria-label="Remarks" maxLength={1000} value={form.remarks} onChange={e => set('remarks', e.target.value)} /> : <span translate="no">{row.remarks || '—'}</span>}</td><td><div className="flex flex-wrap gap-2 min-w-32">{editing ? <><Button primary disabled={action.busy} onClick={() => void action.run('stockSave', form)}>Save</Button><Button disabled={action.busy} onClick={() => {
              setEditing(false);
              action.setError('');
            }}>Cancel</Button></> : <>{can('stock.edit') && <Button onClick={start}>Edit</Button>}{row.state === 'INVENTORY' && can('sales.record') && <Button primary onClick={onSell}>Mark sold</Button>}{can('audit.view') && <Button onClick={onHistory}>History</Button>}</>}</div></td></tr>{editing && <tr><td colSpan={9}><Field label="Reason for stock change"><input minLength={5} maxLength={1000} value={form.reason} onChange={e => set('reason', e.target.value)} /></Field><ErrorMessage error={action.error} /></td></tr>}</>;
}
export default function DealerManagement() {
  const {
    user
  } = useAppSelector(s => s.auth);
  const [access, setAccess] = useState<ModuleAccess | null>(null);
  const [accessError, setAccessError] = useState('');
  const [view, setView] = useState('dealers');
  const [dealerId, setDealerId] = useState('');
  const [profile, setProfile] = useState(false);
  const [dealers, setDealers] = useState<any[]>([]);
  const [data, setData] = useState<ModulePage | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<any>({
    q: '',
    state: '',
    readiness: '',
    settlement: '',
    source: '',
    status: '',
    dealer_type: '',
    from: '',
    to: ''
  });
  const [selected, setSelected] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [dialog, setDialog] = useState<{
    title: string;
    body: ReactNode;
  } | null>(null);
  const can = (permission: string) => !!access?.permissions.includes(permission);
  const reload = () => {
    setRefresh(n => n + 1);
    setSelected([]);
  };
  const done = () => {
    setDialog(null);
    reload();
  };
  useEffect(() => {
    let active = true;
    dm<ModuleAccess>('capabilities').then(result => {
      if (active) setAccess(result);
    }).catch(e => {
      if (active) setAccessError(e.message);
    });
    return () => {
      active = false;
    };
  }, [user?.user_id]);
  useEffect(() => {
    if (!access?.enabled || !can('dealers.view')) return;
    let active = true;
    allModuleDealers().then(rows => {
      if (active) setDealers(rows);
    }).catch(e => {
      if (active) setError(e.message);
    });
    return () => {
      active = false;
    };
  }, [access, refresh]);
  const tabs = [['dealers', 'Dealers', 'dealers.view'], ['stock', 'Stock', 'stock.view'], ['sales', 'Sales', 'sales.view'], ['payments', 'Payments', 'payments.view'], ['adjustments', 'Adjustments', 'payments.view'], ['audit', 'Audit history', 'audit.view']].filter(([,, permission]) => can(permission));
  if (access?.admin) tabs.push(['staff', 'Employee permissions', '']);
  useEffect(() => {
    if (access?.enabled && !tabs.some(([key]) => key === view) && view !== 'overview' && view !== 'statement') setView(tabs[0]?.[0] || 'none');
  }, [access]);
  useEffect(() => {
    let active = true;
    if (!access?.enabled || !['dealers', 'stock', 'sales', 'payments', 'adjustments', 'audit', 'overview'].includes(view)) return;
    setLoading(true);
    setError('');
    setData(null);
    const payload = {
      ...filters,
      dealer_id: dealerId || undefined,
      page,
      limit: 25
    };
    const requests = view === 'overview' ? dm('summary', {
      dealer_id: dealerId
    }).then(result => {
      if (active) setSummary(result);
    }) : dm<ModulePage>(view, payload).then(result => {
      if (active) setData(result);
    });
    requests.catch(e => {
      if (active) setError(e.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [access, view, dealerId, page, filters, refresh]);
  const filter = (key: string, value: string) => {
    setPage(1);
    setSelected([]);
    setFilters((old: any) => ({
      ...old,
      [key]: value
    }));
  };
  const changeView = (next: string) => {
    setView(next);
    setPage(1);
    setSelected([]);
    setFilters({
      q: '',
      state: '',
      readiness: '',
      settlement: '',
      source: '',
      status: '',
      dealer_type: '',
      from: '',
      to: ''
    });
  };
  const openProfile = (dealer: any) => {
    setDealerId(String(dealer.dealer_id));
    setProfile(true);
    changeView(can('sales.view') ? 'overview' : can('stock.view') ? 'stock' : 'statement');
  };
  const openReceipt = async (paymentId: number) => {
    try {
      const receipt = await dm('receipt', {
        payment_id: paymentId
      });
      setDialog({
        title: 'Dealer payment receipt',
        body: <Receipt receipt={receipt} />
      });
    } catch (e: any) {
      setError(e.message);
    }
  };
  const showHistory = async (entity: string, entityId: number) => {
    try {
      const result = await dm<ModulePage>('audit', {
        entity_type: entity,
        entity_id: entityId,
        limit: 100
      });
      setDialog({
        title: 'Record history',
        body: <div className="dm-form">{result.items.map(row => <div className="dm-panel" key={row.audit_id}><strong>{row.action}</strong><p className="text-xs" translate="no">{row.created_at} · Staff #{row.actor_id} · {row.reason}</p><details><summary className="cursor-pointer text-xs">Old / new values</summary><pre className="dm-json" translate="no">{JSON.stringify({
                  before: typeof row.old_json === 'string' ? JSON.parse(row.old_json) : row.old_json,
                  after: typeof row.new_json === 'string' ? JSON.parse(row.new_json) : row.new_json
                }, null, 2)}</pre></details></div>)}{!result.items.length && <p>No history entries.</p>}</div>
      });
    } catch (e: any) {
      setError(e.message);
    }
  };
  if (accessError) return <ErrorMessage error={accessError} />;
  if (!access) return <p role="status">Loading dealer module…</p>;
  if (!access.enabled) return <div className="dm-module dm-panel"><h1>Standalone Dealer Management</h1><p className="dm-notice">This module is disabled or its SQL migration has not been applied. Existing website operations remain available.</p></div>;
  const dealer = dealers.find(d => String(d.dealer_id) === dealerId);
  const profileTabs = [['overview', 'Overview', 'sales.view'], ['stock', 'Stock', 'stock.view'], ['sales', 'Sold', 'sales.view'], ['pending', 'Pending', 'sales.view'], ['paid', 'Paid', 'sales.view'], ['payments', 'Payments', 'payments.view'], ['statement', 'Statement', 'payments.view']].filter(([,, permission]) => can(permission));
  return <div className="dm-module" data-testid="dealer-management">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
    <div className="dm-tabs" style={{ marginBottom: 0 }} role="tablist" aria-label="Dealer module sections">{tabs.map(([key, label]) => <button type="button" role="tab" aria-selected={!profile && view === key} key={key} onClick={() => {
        setProfile(false);
        setDealerId('');
        changeView(key);
      }}>{label}</button>)}</div>
    <Button onClick={reload}>Refresh</Button>
    </div>
    {profile && dealer && <div className="dm-panel mb-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 translate="no">{dealer.dealer_code} · {dealer.name}</h2><p className="dm-subtitle" translate="no">{dealer.contact_name} · {dealer.phone} · {dealer.status}</p></div><div className="dm-actions">{can('dealers.edit') && <Button onClick={() => setDialog({
            title: 'Edit module dealer',
            body: <DealerForm dealer={dealer} admin={!!access.admin} onDone={done} />
          })}>Edit dealer</Button>}<a className="dm-button" href={`https://wa.me/${(dealer.phone.length === 10 ? '91' : '') + dealer.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">WhatsApp</a></div></div><div className="dm-tabs mt-4 mb-0" role="tablist" aria-label="Dealer profile sections">{profileTabs.map(([key, label]) => <button type="button" role="tab" key={key} aria-selected={key === 'pending' ? view === 'sales' && filters.settlement === 'PENDING' : key === 'paid' ? view === 'sales' && filters.settlement === 'PAID' : view === key && !filters.settlement} onClick={() => {
          changeView(key === 'pending' || key === 'paid' ? 'sales' : key);
          if (key === 'pending' || key === 'paid') filter('settlement', key === 'pending' ? 'PENDING' : 'PAID');
        }}>{label}</button>)}</div></div>}
    {!['overview', 'statement', 'staff', 'none'].includes(view) && <><div className="dm-toolbar"><input aria-label="Search module records" placeholder="Search number, dealer or reference" value={filters.q} onChange={e => filter('q', e.target.value)} />{view !== 'dealers' && view !== 'audit' && <DealerSelect all dealers={dealers} value={dealerId} onChange={v => {
          setDealerId(v);
          setPage(1);
          setSelected([]);
          if (!v) setProfile(false);
        }} />}{['dealers', 'stock', 'sales', 'payments', 'adjustments'].includes(view) && <select aria-label="Dealer type filter" value={filters.dealer_type} onChange={e => filter('dealer_type', e.target.value)}><option value="">All dealer types</option><option value="BASIC">Basic</option><option value="PREMIUM">Premium</option></select>}{view === 'stock' && <><select aria-label="Stock state filter" value={filters.state} onChange={e => filter('state', e.target.value)}><option value="">All stock states</option>{['INVENTORY', 'SOLD', 'INACTIVE'].map(v => <option key={v}>{v}</option>)}</select><select aria-label="Readiness filter" value={filters.readiness} onChange={e => filter('readiness', e.target.value)}><option value="">All readiness</option>{['RTP', 'NON_RTP', 'RTA'].map(v => <option key={v}>{v}</option>)}</select></>}{view === 'sales' && <><select aria-label="Sale source filter" value={filters.source} onChange={e => filter('source', e.target.value)}><option value="">All sale sources</option><option value="ONLINE">Online</option><option value="OFFLINE">Offline</option></select><select aria-label="Sale settlement filter" value={filters.settlement} onChange={e => filter('settlement', e.target.value)}><option value="">All settlements</option><option value="PENDING">Pending</option><option value="PAID">Paid</option></select><select aria-label="Sale status filter" value={filters.status} onChange={e => filter('status', e.target.value)}><option value="">All sale states</option><option value="ACTIVE">Active</option><option value="CANCELLED">Cancelled</option></select></>}{view === 'payments' && <select aria-label="Payment status filter" value={filters.status} onChange={e => filter('status', e.target.value)}><option value="">All payments</option><option value="POSTED">Posted</option><option value="VOIDED">Voided</option></select>}{view !== 'dealers' && <><input type="date" aria-label="From date" value={filters.from} onChange={e => filter('from', e.target.value)} /><input type="date" aria-label="To date" value={filters.to} onChange={e => filter('to', e.target.value)} /></>}</div></>}
    <div className="dm-actions mb-3">{view === 'dealers' && can('dealers.create') && <Button primary onClick={() => setDialog({
        title: 'Create module dealer',
        body: <DealerForm admin={!!access.admin} onDone={done} />
      })}>Create module dealer</Button>}{['stock', 'overview'].includes(view) && can('stock.upload') && <><Button primary onClick={() => setDialog({
          title: 'Add standalone stock',
          body: <StockForm dealers={dealers} dealerId={dealerId} onDone={done} />
        })}>Add numbers</Button><Button onClick={() => setDialog({
          title: 'Import standalone stock',
          body: <ImportForm dealerId={dealerId} onDone={done} />
        })}>Import CSV / XLSX</Button></>}{view === 'stock' && <><Button onClick={async () => {
          try {
            downloadWorkbook(await dm('export', {
              ...filters,
              dealer_id: dealerId || undefined
            }));
          } catch (e: any) {
            setError(e.message);
          }
        }}>Export stock</Button>{can('stock.edit') && <Button disabled={!selected.length} onClick={() => setDialog({
          title: 'Bulk stock change',
          body: <BulkForm rows={selected} dealers={dealers} can={can} onDone={done} />
        })}>Bulk edit ({selected.length})</Button>}</>}{['payments', 'sales', 'overview'].includes(view) && can('payments.record') && <Button primary disabled={!dealerId} onClick={() => setDialog({
        title: 'Record dealer settlement',
        body: <PaymentForm dealerId={dealerId} onDone={result => {
          done();
          if (result) void openReceipt(result.payment_id);
        }} />
      })}>Record payment</Button>}</div>
    <ErrorMessage error={error} />{loading && <p role="status">Loading module records…</p>}
    {view === 'none' && <p className="dm-notice">No staff permissions have been granted for this module.</p>}
    {view === 'overview' && summary && <Stats values={[["Total stock", summary.total_stock], ["Live", summary.live], ["Sold", summary.sold], ["Total payable", summary.total_payable, true], ["Paid", summary.paid, true], ["Pending", summary.pending, true], ["Net profit", summary.profit, true], ["Recovery outstanding", summary.recovery_outstanding, true]]} />}
    {view === 'staff' && access.admin && <div className="dm-panel"><StaffForm /></div>}{view === 'statement' && dealerId && <DealerStatement dealerId={dealerId} />}
    {data && <>{view === 'sales' && data.summary && <Stats values={[["Sales", data.summary.total_sales], ["Revenue", data.summary.revenue, true], ["Dealer cost", data.summary.dealer_cost, true], ["Expenses", data.summary.expenses, true], ["Net profit", data.summary.profit, true], ["Dealer pending", data.summary.pending, true]]} />}
      <div className="dm-table-wrap"><table className="dm-table"><thead><tr>{(view === 'dealers' ? ['Dealer', 'Contact', 'Type', 'Status', 'Actions'] : view === 'stock' ? ['', 'Number / patterns', 'Dealer', 'Dealer cost', 'Selling price', 'Readiness', 'State', 'Remarks', 'Actions'] : view === 'sales' ? ['Number', 'Dealer', 'Sale', 'Locked cost', 'Charges', 'Commission', 'Profit / loss', 'Source / date', 'Settlement', 'Actions'] : view === 'payments' ? ['Payment', 'Dealer', 'Gross cleared', 'Recovery', 'Net payment', 'Mode / reference', 'Paid date', 'Status', 'Actions'] : view === 'adjustments' ? ['Entry', 'Dealer', 'Sale', 'Type', 'Amount', 'Reason', 'Date'] : ['Entry', 'Entity', 'Action', 'Staff', 'Date', 'Reason', 'Changes']).map((title, index) => <th key={index}>{view === 'stock' && index === 0 ? <input type="checkbox" aria-label="Select page stock" checked={!!data.items.length && selected.length === data.items.length} onChange={e => setSelected(e.target.checked ? data.items : [])} /> : title}</th>)}</tr></thead><tbody>
      {data.items.map(row => view === 'dealers' ? <tr key={row.dealer_id}><td><strong translate="no">{row.dealer_code}</strong><p translate="no">{row.name}</p></td><td translate="no">{row.contact_name}<br />{row.phone}<br />{row.email}</td><td>{row.dealer_type}</td><td>{row.status}</td><td><div className="flex flex-wrap gap-2"><Button onClick={() => openProfile(row)}>Open profile</Button>{can('dealers.edit') && <Button onClick={() => setDialog({
                    title: 'Edit module dealer',
                    body: <DealerForm dealer={row} admin={!!access.admin} onDone={done} />
                  })}>Edit</Button>}</div></td></tr> : view === 'stock' ? <StockRow key={`${row.stock_id}-${row.version}`} row={row} dealers={dealers} can={can} onDone={reload} selected={selected.some(s => s.stock_id === row.stock_id)} onSelect={checked => setSelected(old => checked ? [...old, row] : old.filter(r => r.stock_id !== row.stock_id))} onSell={() => setDialog({
              title: 'Confirm standalone sale',
              body: <SaleForm stock={row} onDone={done} />
            })} onHistory={() => void showHistory('STOCK', row.stock_id)} /> : view === 'sales' ? <tr key={row.sale_id}><td className="dm-number" translate="no">{row.number_value}<small className="block">Sale #{row.sale_id}</small></td><td translate="no">{row.dealer_code}<br />{row.dealer_name}</td>{['sale_price', 'dealer_cost', 'charges', 'commission', 'profit'].map(key => <td className="dm-nowrap" key={key} translate="no">{rupee(row[key])}</td>)}<td>{row.sale_source}<small className="block" translate="no">{row.sold_at}<br />{row.external_reference}</small></td><td>{row.settlement_status}</td><td><div className="flex flex-wrap gap-2 min-w-32">{row.status === 'ACTIVE' && can('adjustments') && <><Button onClick={() => setDialog({
                      title: 'Cancel standalone sale',
                      body: <CorrectionForm sale={row} dealers={dealers} cancel onDone={done} />
                    })}>Cancel sale</Button>{can('sales.record') && can('stock.edit') && <Button onClick={() => setDialog({
                      title: 'Correct sale with adjustment',
                      body: <CorrectionForm sale={row} dealers={dealers} onDone={done} />
                    })}>Correct sale</Button>}</>}{can('audit.view') && <Button onClick={() => void showHistory('SALE', row.sale_id)}>History</Button>}</div></td></tr> : view === 'payments' ? <tr key={row.payment_id}><td translate="no">{row.payment_code}</td><td translate="no">{row.dealer_code}<br />{row.dealer_name}</td>{['gross_amount', 'recovery_amount', 'net_amount'].map(key => <td translate="no" key={key}>{rupee(row[key])}</td>)}<td translate="no">{row.payment_mode}<br />{row.reference_no}</td><td translate="no">{row.paid_at}</td><td>{row.status}</td><td><div className="flex flex-wrap gap-2"><Button onClick={() => void openReceipt(row.payment_id)}>Receipt</Button>{row.status === 'POSTED' && can('adjustments') && <Button danger onClick={() => setDialog({
                    title: 'Reverse recorded payment',
                    body: <VoidPaymentForm payment={row} onDone={done} />
                  })}>Reverse</Button>}</div></td></tr> : view === 'adjustments' ? <tr key={row.adjustment_id}><td translate="no">#{row.adjustment_id}</td><td translate="no">{row.dealer_code}</td><td translate="no">#{row.sale_id}</td><td>{row.adjustment_type}</td><td translate="no">{rupee(row.amount)}</td><td translate="no">{row.reason}</td><td translate="no">{row.created_at}</td></tr> : <tr key={row.audit_id}><td translate="no">#{row.audit_id}</td><td>{row.entity_type} #{row.entity_id}</td><td>{row.action}</td><td translate="no">#{row.actor_id}</td><td translate="no">{row.created_at}</td><td translate="no">{row.reason}</td><td><Button onClick={() => void showHistory(row.entity_type, row.entity_id)}>History</Button></td></tr>)}
      </tbody></table>{!data.items.length && <p className="p-5 text-sm text-muted-foreground">No module records match these filters.</p>}</div><Pager page={page} total={data.total} onPage={next => {
        setPage(next);
        setSelected([]);
      }} /></>}
    {dialog && <Modal open wide onClose={() => setDialog(null)} title={dialog.title} className="dm-dialog"><div className="dm-module">{dialog.body}</div></Modal>}
  </div>;
}
