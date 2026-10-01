import { formatINR } from '@/core/lib/format';

export default function BillingSummary({ billing }: { billing: any }) {
  const rows = [['MRP total', billing.mrp_total], ['Offer savings', -billing.offer_savings], ['Offer subtotal', billing.subtotal], ['Coupon discount', -billing.discount], ['Taxable amount', billing.taxable_amount], [`GST (${billing.gst_percent}%)`, billing.gst_amount]] as const;
  return <dl className="billing-summary space-y-2 text-xs">
    {rows.map(([label, amount]) => <div key={label} className="flex items-center justify-between gap-3"><dt className="text-muted-foreground">{label}</dt><dd className={Number(amount) < 0 ? 'font-semibold text-success' : 'font-semibold'}>{Number(amount) < 0 ? '−' : ''}{formatINR(Math.abs(Number(amount)))}</dd></div>)}
    <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-base font-black"><dt>Total payable</dt><dd>{formatINR(billing.total)}</dd></div>
  </dl>;
}
