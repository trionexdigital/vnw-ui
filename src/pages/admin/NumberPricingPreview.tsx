/** Display-only preview. The API independently validates and calculates all stored prices. */
export default function NumberPricingPreview({ base, additional = '' }: { base: string | number; additional?: string | number }) {
  const amount = String(base ?? '').trim(), discount = String(additional ?? '').trim() || '0';
  if (!/^\d+(\.\d{1,2})?$/.test(amount) || !/^\d+(\.\d{1,2})?$/.test(discount) || amount.length > 20 || Number(amount) <= 0 || Number(discount) >= 100) return null;
  const units = (value: string) => { const [whole, fraction = ''] = value.split('.'); return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0')); };
  const round = (n: bigint, d: bigint) => (n + d / 2n) / d;
  const baseUnits = units(amount), extra = units(discount);
  const listed = round(baseUnits * 125n, 100n);
  const automatic = round(baseUnits * 125n * 95n, 10000n);
  const final = round(baseUnits * 125n * 95n * (10000n - extra), 100000000n);
  const money = (n: bigint) => `₹${(n / 100n).toLocaleString('en-IN')}.${String(n % 100n).padStart(2, '0')}`;
  return <div className="grid gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 sm:col-span-2 sm:grid-cols-3" aria-label="Number pricing preview">
    {[['Website listed price (+25%)', listed], ['After automatic 5% discount', automatic], ['Final customer price', final]].map(([label, value]) => <div key={String(label)} className="min-w-0"><p className="text-[10px] font-semibold text-muted-foreground">{String(label)}</p><strong className="mt-1 block break-all text-sm text-primary" data-no-translate>{money(value as bigint)}</strong></div>)}
    <p className="text-[10px] text-muted-foreground sm:col-span-3">Additional discount applies after the automatic 5% discount. Final prices are verified when saved.</p>
  </div>;
}
