import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, GitCompareArrows } from 'lucide-react';
import CompactPageHeader from '@/shared/components/CompactPageHeader';
import { numbersAPI } from '@/core/api/vnwAPI';
import { useStore } from '@/shared/store/useStore';
import { formatINR, BADGE_META, digitTotal, numerologySum } from '@/core/lib/format';
import { getPrimaryCategory } from '@/core/categories/types';
import { Loader, EmptyState } from '@/shared/components/ui-bits';
import { getNumberPurchaseMode, numberActionPath, numberReadinessLabel } from '@/core/lib/numberPurchaseMode';

export default function Compare() {
  const navigate = useNavigate();
  const { compare, toggleCompare, clearCompare } = useStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const results = await Promise.all(compare.map((id) => numbersAPI.detail(id).catch(() => null)));
        setItems(results.filter(Boolean));
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, [compare.join(',')]);

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-10"><Loader /></div>;

  if (items.length === 0) return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <EmptyState title="No numbers to compare" subtitle="Add up to 4 numbers using the Compare button on any card."
        action={<Link to="/shop" className="btn-gold">Browse Numbers</Link>} />
    </div>
  );

  const rows: [string, (n: any) => any][] = [
    ['Price', (n) => formatINR(n.offer_price)],
    ['MRP', (n) => formatINR(n.mrp)],
    ['Discount', (n) => `${n.discount_pct ?? Math.round((1 - Number(n.offer_price) / Number(n.mrp)) * 100)}%`],
    ['Category', (n) => getPrimaryCategory(n)?.name || '—'],
    ['Digit total', (n) => digitTotal(n.number_value || n.display_number)],
    ['Numerology root', (n) => numerologySum(n.number_value || n.display_number)],
    ['Badge', (n) => BADGE_META[n.badge || 'NONE']?.label || '—'],
    ['Status', (n) => n.status],
    ['Porting / activation', (n) => numberReadinessLabel(n)],
  ];

  return (
    <div className="commerce-page compare-page">
      <CompactPageHeader title="Compare numbers" subtitle="Compare up to four favourites side by side." icon={GitCompareArrows} action={<button onClick={clearCompare} className="btn-gold-outline min-h-9 text-xs">Clear all</button>} />
      <div className="commerce-panel overflow-x-auto !p-0">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-card-border">
              <th className="sticky left-0 z-10 bg-card px-3 py-3 text-left text-xs uppercase text-muted-foreground">Feature</th>
              {items.map((n) => (
                <th key={n.number_id} className="min-w-40 bg-primary/5 px-3 py-3 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <button onClick={() => toggleCompare(n.number_id)} aria-label={`Remove ${n.display_number} from comparison`} className="self-end text-muted-foreground hover:text-rose-400"><X className="h-4 w-4" /></button>
                    <button onClick={() => navigate(`/number/${n.number_id}`)} className="whitespace-nowrap text-base font-black text-foreground">{n.display_number}</button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, fn]) => (
              <tr key={label} className="border-b border-card-border last:border-0">
                <td className="sticky left-0 z-10 min-w-28 bg-card px-3 py-2.5 text-muted-foreground">{label}</td>
                {items.map((n) => <td key={n.number_id} className="px-3 py-2.5 text-center text-foreground">{fn(n)}</td>)}
              </tr>
            ))}
            <tr>
              <td className="px-3 py-2.5" />
              {items.map((n) => (
                <td key={n.number_id} className="px-3 py-2.5 text-center">
                  <button onClick={() => navigate(numberActionPath(n))} className="btn-gold min-h-9 text-xs" disabled={getNumberPurchaseMode(n) === 'UNAVAILABLE'}>{getNumberPurchaseMode(n) === 'PREBOOK' ? 'Pre-book' : 'Buy Now'}</button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
