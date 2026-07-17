import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Crown, MessageSquare, ShoppingBag } from 'lucide-react';
import { notificationsAPI } from '@/core/api/vnwAPI';
import { PageHeader } from '@/shared/components/ui-bits';
import { useToast } from '@/shared/hooks/use-toast';

const fallback = [
  { id: 1, title: 'New VIP number added', message: 'A premium listing is waiting for review.', time: '2 min', type: 'catalog', read: false },
  { id: 2, title: 'Order activity', message: 'Recent order status needs attention.', time: '18 min', type: 'order', read: false },
  { id: 3, title: 'Customer message', message: 'A buyer asked about number transfer.', time: '1 hr', type: 'message', read: false },
  { id: 4, title: 'Daily console summary', message: 'Your admin dashboard has new catalog and sales activity.', time: 'Today', type: 'summary', read: true },
];

const icons: Record<string, any> = {
  catalog: Crown,
  order: ShoppingBag,
  message: MessageSquare,
  summary: Bell,
};

export default function Notifications() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>(fallback);

  useEffect(() => {
    notificationsAPI.get()
      .then((data: any) => {
        const rows = Array.isArray(data) ? data : data?.items;
        if (Array.isArray(rows) && rows.length) setItems(rows);
      })
      .catch(() => {});
  }, []);

  const markAll = async () => {
    try {
      await notificationsAPI.markAllRead();
    } catch {
      // Keep local fallback behavior if the endpoint is not ready.
    }
    setItems((rows) => rows.map((n) => ({ ...n, read: true })));
    toast({ title: 'Notifications marked as read' });
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Notifications"
        subtitle="Review admin alerts, customer messages and catalog updates"
        action={<button onClick={markAll} className="btn-gold-outline min-h-11 text-sm"><CheckCheck className="h-4 w-4" /> Mark all read</button>}
      />

      <div className="vnw-card grid gap-2 p-3">
        {items.map((n, index) => {
          const Icon = icons[n.type] || Bell;
          return (
            <article key={n.id || index} className="flex gap-3 rounded-2xl bg-muted/65 p-3 shadow-sm">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent"><Icon className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-black text-foreground">{n.title || n.heading || 'Notification'}</h3>
                  <span className="shrink-0 text-[10px] font-black text-muted-foreground">{n.time || n.created_at || ''}</span>
                </div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{n.message || n.text || n.content}</p>
              </div>
              {!n.read && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />}
            </article>
          );
        })}
      </div>
    </div>
  );
}
