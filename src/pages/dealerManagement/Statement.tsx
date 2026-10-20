import { useEffect, useState } from 'react';
import { dm } from '@/core/api/dealerManagement';
import { Button, ErrorMessage, Pager, Stats, rupee } from './components';
import './module.css';
export default function DealerStatement({
  dealerId
}: {
  dealerId?: string;
}) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    settlement: '',
    from: '',
    to: '',
    q: ''
  });
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setData(null);
    setError('');
    dm('statement', {
      dealer_id: dealerId || undefined,
      page,
      limit: 25,
      ...filters
    }).then(result => {
      if (active) setData(result);
    }).catch(e => {
      if (active) setError(e.message);
    });
    return () => {
      active = false;
    };
  }, [dealerId, page, filters, refresh]);
  const filter = (key: string, value: string) => {
    setPage(1);
    setFilters(old => ({
      ...old,
      [key]: value
    }));
  };
  const share = data ? ['VIP Number World', `${data.dealer.dealer_code} · ${data.dealer.name}`, `Total sold (dealer amount): ${rupee(data.summary.total_sold)}`, `Total paid: ${rupee(data.summary.total_paid)}`, `Pending: ${rupee(data.summary.pending)}`, `Recovery outstanding: ${rupee(data.summary.recovery_outstanding)}`].join('\n') : '';
  return <section className="dm-module" data-testid="dealer-statement"><div className="dm-heading"><div><h1>Dealer Statement</h1><p className="dm-subtitle">{data ? <span translate="no">{data.dealer.dealer_code} · {data.dealer.name}</span> : <span>Your standalone dealer account</span>}</p></div><Button onClick={() => setRefresh(n => n + 1)}>Refresh</Button></div>
    <div className="dm-toolbar"><input aria-label="Search statement" placeholder="Search number" value={filters.q} onChange={e => filter('q', e.target.value)} /><select aria-label="Statement status" value={filters.settlement} onChange={e => filter('settlement', e.target.value)}><option key="option-all" value="">All statuses</option><option key="option-PENDING" value="PENDING">Pending</option><option key="option-PAID" value="PAID">Paid</option></select><input aria-label="From date" type="date" value={filters.from} onChange={e => filter('from', e.target.value)} /><input aria-label="To date" type="date" value={filters.to} onChange={e => filter('to', e.target.value)} /></div>
    <ErrorMessage error={error} />{!data && !error && <p role="status">Loading statement…</p>}{data && <><Stats values={[["Total sold (dealer amount)", data.summary.total_sold, true], ["Total paid", data.summary.total_paid, true], ["Pending", data.summary.pending, true], ["Recovery outstanding", data.summary.recovery_outstanding, true]]} /><div className="dm-table-wrap"><table className="dm-table"><thead><tr><th>Number</th><th>Sold date</th><th>Dealer amount</th><th>Status</th><th>Paid date</th><th>Payment ID</th></tr></thead><tbody>{data.items.map((row: any) => <tr key={row.sale_id}><td className="dm-number" translate="no">{row.number_value}</td><td translate="no">{row.sold_at}</td><td translate="no">{rupee(row.dealer_amount)}</td><td>{row.settlement_status}</td><td translate="no">{row.paid_at || '—'}</td><td translate="no">{row.payment_code || '—'}</td></tr>)}</tbody></table>{!data.items.length && <p className="p-4 text-sm">No statement records match these filters.</p>}</div><Pager page={page} total={data.total} onPage={setPage} />{data.adjustments.length > 0 && <div className="dm-panel mt-4"><h2>Adjustments</h2><div className="dm-table-wrap mt-3"><table className="dm-table"><thead><tr><th>Entry</th><th>Sale</th><th>Type</th><th>Amount</th><th>Date</th></tr></thead><tbody>{data.adjustments.map((a: any) => <tr key={a.adjustment_id}><td translate="no">#{a.adjustment_id}</td><td translate="no">#{a.sale_id}</td><td>{a.adjustment_type === 'RECOVERY' ? 'Recovery' : 'Payable reversal'}</td><td translate="no">{rupee(a.amount)}</td><td translate="no">{a.created_at}</td></tr>)}</tbody></table></div></div>}<div className="dm-actions"><a className="dm-button" href={`https://wa.me/?text=${encodeURIComponent(share)}`} target="_blank" rel="noopener noreferrer">Share statement summary</a></div></>}
  </section>;
}
