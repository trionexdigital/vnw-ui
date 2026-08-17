import { useEffect, useState } from 'react';
import { adminAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, Loader, StatusBadge, Money, Table } from '@/shared/components/ui-bits';
import Modal from '@/shared/components/Modal';

const ORDER_STATUSES = ['PENDING', 'PAID', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED'];

export default function AdminOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [detail,setDetail]=useState<any>(null);

  const load = () => { setLoading(true); adminAPI.ordersList({ status: filter || undefined }).then(setOrders).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const update = async (id: number, status: string) => {
    try { await adminAPI.orderUpdateStatus(id, status); toast({ title: 'Order updated' }); load(); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };
  const openDetail=async(id:number)=>{try{setDetail(await adminAPI.orderDetail(id));}catch(e:any){toast({title:'Could not load order',description:e.message,variant:'destructive'});}};
  const updateItem=async(item:any,status:string)=>{try{await adminAPI.accessoryFulfilmentUpdate({accessory_order_item_id:item.accessory_order_item_id,fulfillment_status:status,carrier:item.carrier,tracking_number:item.tracking_number});setDetail(await adminAPI.orderDetail(detail.order_id));toast({title:'Accessory fulfilment updated'});}catch(e:any){toast({title:'Update failed',description:e.message,variant:'destructive'});}};

  return (
    <div>
      <PageHeader title="Orders" subtitle="Manage customer orders & fulfilment" />
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setFilter('')} className={`rounded-full px-3 py-1 text-xs ${!filter ? 'btn-gold' : 'btn-gold-outline'}`}>All</button>
        {ORDER_STATUSES.map((s) => <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-3 py-1 text-xs ${filter === s ? 'btn-gold' : 'btn-gold-outline'}`}>{s}</button>)}
      </div>
      {loading ? <Loader /> : (
        <Table head={['Order', 'Customer', 'Total', 'Payment', 'Status', 'Date', 'Update']}>
          {orders.map((o) => (
            <tr key={o.order_id} className="border-b border-card-border last:border-0">
              <td className="px-4 py-3 font-medium text-foreground"><button className="text-left hover:text-primary" onClick={()=>openDetail(o.order_id)}>{o.order_no}</button></td>
              <td className="px-4 py-3 text-muted-foreground">{o.full_name || '—'}</td>
              <td className="px-4 py-3"><Money value={o.total} /></td>
              <td className="px-4 py-3"><StatusBadge status={o.payment_status} /></td>
              <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
              <td className="px-4 py-3 text-muted-foreground">{String(o.created_at).slice(0, 10)}</td>
              <td className="px-4 py-3">
                <select defaultValue={o.status} onChange={(e) => update(o.order_id, e.target.value)}
                  className="rounded-lg border border-card-border bg-secondary px-2 py-1 text-xs outline-none">
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </Table>
      )}
      <Modal open={!!detail} onClose={()=>setDetail(null)} title={detail?`Order ${detail.order_no}`:'Order'} wide>{detail&&<div className="space-y-4"><div className="grid gap-3 rounded-xl bg-muted p-4 text-sm sm:grid-cols-2"><div><span className="text-muted-foreground">Payment</span><br/><StatusBadge status={detail.payment_status}/></div><div><span className="text-muted-foreground">Order</span><br/><StatusBadge status={detail.status}/></div>{detail.shipping_name&&<div className="sm:col-span-2"><b>Delivery:</b> {detail.shipping_name}, {detail.shipping_address_line1}, {detail.shipping_city}, {detail.shipping_state} {detail.shipping_postal_code} · {detail.shipping_phone}</div>}</div>{detail.items?.map((it:any)=><div key={`${it.item_type}-${it.item_id}`} className="rounded-xl border border-border p-4"><div className="flex items-center justify-between gap-3"><div><b>{it.item_type==='ACCESSORY'?it.name:it.display_number}</b><div className="text-xs text-muted-foreground">{it.item_type} · Qty {it.quantity}</div></div><Money value={it.line_total}/></div>{it.item_type==='ACCESSORY'&&<div className="mt-4 grid gap-2 sm:grid-cols-3"><input className="min-h-11 rounded-xl border border-border bg-secondary px-3 text-sm" placeholder="Carrier" defaultValue={it.carrier||''} onChange={e=>it.carrier=e.target.value}/><input className="min-h-11 rounded-xl border border-border bg-secondary px-3 text-sm" placeholder="Tracking number" defaultValue={it.tracking_number||''} onChange={e=>it.tracking_number=e.target.value}/><select className="min-h-11 rounded-xl border border-border bg-secondary px-3 text-sm" value={it.fulfillment_status} onChange={e=>updateItem(it,e.target.value)}>{['PENDING','PACKED','SHIPPED','DELIVERED','CANCELLED','REFUNDED','REPLACEMENT'].map(s=><option key={s}>{s}</option>)}</select></div>}</div>)}</div>}</Modal>
    </div>
  );
}
