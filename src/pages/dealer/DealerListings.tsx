import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { dealerAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, Loader, StatusBadge, Money, EmptyState, Table } from '@/shared/components/ui-bits';

export default function DealerListings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); dealerAPI.listings().then((d) => setItems(d.items || [])).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const del = async (id: number) => {
    if (!confirm('Delete this listing?')) return;
    try { await dealerAPI.deleteListing(id); toast({ title: 'Listing deleted' }); load(); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <PageHeader title="My Listings" subtitle="Manage your VIP number listings"
        action={<Link to="/dealer/listings/new" className="btn-gold text-sm">+ Add Number</Link>} />
      {items.length === 0 ? (
        <EmptyState title="No listings yet" subtitle="Add your first VIP number to start selling."
          action={<Link to="/dealer/listings/new" className="btn-gold">Add Number</Link>} />
      ) : (
        <Table head={['Number', 'Category', 'MRP', 'Offer', 'Status', 'Views', '']}>
          {items.map((n) => (
            <tr key={n.number_id} className="border-b border-card-border last:border-0">
              <td className="px-4 py-3 font-bold text-foreground">{n.display_number}</td>
              <td className="px-4 py-3 text-muted-foreground">{n.category_name || '—'}</td>
              <td className="px-4 py-3"><Money value={n.mrp} /></td>
              <td className="px-4 py-3"><Money value={n.offer_price} /></td>
              <td className="px-4 py-3"><StatusBadge status={n.status} /></td>
              <td className="px-4 py-3 text-muted-foreground">{n.views}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button onClick={() => navigate(`/dealer/listings/${n.number_id}/edit`)} className="text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => del(n.number_id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
