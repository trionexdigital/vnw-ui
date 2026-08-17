import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { accessoriesAPI, accessoryImageUrl, ordersAPI } from '@/core/api/vnwAPI';
import { getPrimaryCategory } from '@/core/categories/types';
import { Loader, StatusBadge, Money } from '@/shared/components/ui-bits';
import Modal from '@/shared/components/Modal';
import { useToast } from '@/shared/hooks/use-toast';

export default function OrderDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const success = params.get('success') === '1';
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [returnItem, setReturnItem] = useState<any>(null); const [returnForm,setReturnForm]=useState({reason:'DAMAGED',requested_resolution:'REPLACEMENT',customer_note:''}); const {toast}=useToast();

  useEffect(() => { ordersAPI.detail(Number(id)).then(setOrder).catch(() => {}).finally(() => setLoading(false)); }, [id]);

  if (loading) return <Loader />;
  if (!order) return <div className="text-muted-foreground">Order not found. <Link to="/orders" className="text-primary">Back</Link></div>;

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/orders" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> All Orders</Link>

      {success && (
        <div className="vnw-card mb-5 flex items-center gap-3 border-emerald-500/40 p-4">
          <CheckCircle2 className="h-6 w-6 text-success" />
          <div><div className="font-semibold text-foreground">Payment successful!</div>
            <div className="text-sm text-muted-foreground">Your number transfer and accessory fulfilment are tracked independently below.</div></div>
        </div>
      )}

      <div className="vnw-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-foreground">Order {order.order_no}</h1>
            <p className="text-sm text-muted-foreground">{String(order.created_at).slice(0, 16).replace('T', ' ')}</p>
          </div>
          <div className="flex gap-2"><StatusBadge status={order.payment_status} /><StatusBadge status={order.status} /></div>
        </div>

        <div className="mt-5 divide-y divide-card-border">
          {order.items?.map((it: any) => (
            <div key={`${it.item_type}-${it.order_item_id || it.accessory_order_item_id}`} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                {it.item_type==='ACCESSORY'?<div className="flex items-center gap-3">{it.primary_image_id&&<img src={accessoryImageUrl(it.primary_image_id)} className="h-14 w-14 rounded-xl object-contain" alt=""/>}<div><div className="font-bold text-foreground">{it.name}</div><div className="text-xs text-muted-foreground">{it.brand} · {it.sku} · Qty {it.quantity}</div><div className="mt-1 flex flex-wrap gap-2"><StatusBadge status={it.fulfillment_status}/>{it.carrier&&<span className="text-xs">{it.carrier} {it.tracking_number}</span>}</div></div></div>:<><div className="text-lg font-bold text-foreground">{it.display_number}</div><div className="text-xs text-muted-foreground">{getPrimaryCategory(it)?.name || 'Unique'} · <StatusBadge status={it.item_status} /></div></>}
              </div>
              <div className="text-right"><Money value={it.line_total ?? it.price}/>{it.item_type==='ACCESSORY'&&it.can_return&&<button onClick={()=>setReturnItem(it)} className="btn-gold-outline mt-2 block text-xs">Report an issue</button>}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-1 border-t border-card-border pt-4 text-sm">
          <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{<Money value={order.subtotal} />}</span></div>
          {Number(order.discount) > 0 && <div className="flex justify-between text-muted-foreground"><span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</span><span>- <Money value={order.discount} /></span></div>}
          <div className="flex justify-between text-base font-bold"><span className="text-foreground">Total</span><Money value={order.total} /></div>
        </div>
        {order.shipping_name&&<div className="mt-5 rounded-xl border border-border bg-muted/40 p-4 text-sm"><b className="text-foreground">Delivery address</b><p className="mt-1 text-muted-foreground">{order.shipping_name} · {order.shipping_phone}<br/>{order.shipping_address_line1}{order.shipping_address_line2?`, ${order.shipping_address_line2}`:''}<br/>{order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}</p></div>}
        <p className="mt-5 text-xs text-muted-foreground">Need help? Review the <Link to="/delivery-fulfilment-policy" className="text-primary">Delivery Policy</Link>, <Link to="/mnp-activation-policy" className="text-primary">MNP Policy</Link>, or <Link to="/refund-policy" className="text-primary">Refund Policy</Link>.</p>
      </div>
      <Modal open={!!returnItem} onClose={()=>setReturnItem(null)} title="Report an accessory issue"><form onSubmit={async e=>{e.preventDefault();try{await accessoriesAPI.requestReturn({accessory_order_item_id:returnItem.accessory_order_item_id,...returnForm} as any);toast({title:'Request submitted for review'});setReturnItem(null);const fresh=await ordersAPI.detail(Number(id));setOrder(fresh);}catch(err:any){toast({title:'Could not submit request',description:err.message,variant:'destructive'});}}} className="space-y-4"><p className="text-sm text-muted-foreground">Issue requests are available within seven days of recorded delivery for damaged, defective, or incorrect items.</p><label className="block text-xs font-bold text-muted-foreground">Issue<select className="mt-1 min-h-11 w-full rounded-xl border border-border bg-secondary px-3" value={returnForm.reason} onChange={e=>setReturnForm({...returnForm,reason:e.target.value})}><option value="DAMAGED">Damaged</option><option value="DEFECTIVE">Defective</option><option value="WRONG_ITEM">Incorrect product</option></select></label><label className="block text-xs font-bold text-muted-foreground">Preferred resolution<select className="mt-1 min-h-11 w-full rounded-xl border border-border bg-secondary px-3" value={returnForm.requested_resolution} onChange={e=>setReturnForm({...returnForm,requested_resolution:e.target.value})}><option value="REPLACEMENT">Replacement</option><option value="REFUND">Refund</option></select></label><label className="block text-xs font-bold text-muted-foreground">Details<textarea required rows={4} className="mt-1 w-full rounded-xl border border-border bg-secondary p-3" value={returnForm.customer_note} onChange={e=>setReturnForm({...returnForm,customer_note:e.target.value})}/></label><button className="btn-gold w-full">Submit issue request</button></form></Modal>
    </div>
  );
}
