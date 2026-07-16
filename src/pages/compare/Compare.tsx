import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { numbersAPI } from '@/core/api/vnwAPI';
import { useStore } from '@/shared/store/useStore';
import { formatINR, BADGE_META } from '@/core/lib/format';
import { Loader, EmptyState } from '@/shared/components/ui-bits';

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
    ['Discount', (n) => `${n.discount_pct || 0}%`],
    ['Category', (n) => n.category_name || '—'],
    ['Numerology Sum', (n) => n.numerology_sum ?? '—'],
    ['Badge', (n) => BADGE_META[n.badge || 'NONE'].label || '—'],
    ['Status', (n) => n.status],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-foreground">Compare Numbers</h1>
        <button onClick={clearCompare} className="btn-gold-outline text-sm">Clear All</button>
      </div>
      <div className="vnw-card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border">
              <th className="px-4 py-4 text-left text-xs uppercase text-muted-foreground">Feature</th>
              {items.map((n) => (
                <th key={n.number_id} className="px-4 py-4 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <button onClick={() => toggleCompare(n.number_id)} className="self-end text-muted-foreground hover:text-rose-400"><X className="h-4 w-4" /></button>
                    <button onClick={() => navigate(`/number/${n.number_id}`)} className="text-lg font-extrabold text-royal">{n.display_number}</button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, fn]) => (
              <tr key={label} className="border-b border-card-border last:border-0">
                <td className="px-4 py-3 text-muted-foreground">{label}</td>
                {items.map((n) => <td key={n.number_id} className="px-4 py-3 text-center text-foreground">{fn(n)}</td>)}
              </tr>
            ))}
            <tr>
              <td className="px-4 py-3" />
              {items.map((n) => (
                <td key={n.number_id} className="px-4 py-3 text-center">
                  <button onClick={() => navigate(`/checkout?number_id=${n.number_id}`)} className="btn-gold text-xs" disabled={n.status !== 'AVAILABLE'}>Buy Now</button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
