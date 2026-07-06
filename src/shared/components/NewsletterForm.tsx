import { useState } from 'react';
import { Send } from 'lucide-react';
import { siteAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';

export default function NewsletterForm({ dark, source = 'footer' }: { dark?: boolean; source?: string }) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      const res = await siteAPI.subscribe(email, source);
      if (res?.status === 1) { setEmail(''); toast({ title: 'Subscribed 🎉', description: res.info }); }
      else throw new Error(res?.info || 'Failed');
    } catch (e: any) { toast({ title: 'Error', description: e.message || 'Could not subscribe', variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="flex w-full gap-2">
      <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email"
        className={`min-w-0 flex-1 rounded-lg px-3 py-2.5 text-sm outline-none ${dark ? 'border border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-gold' : 'border border-card-border bg-secondary/60 focus:border-gold'}`} />
      <button disabled={busy} className="btn-gold shrink-0"><Send className="h-4 w-4" /> {busy ? '...' : 'Subscribe'}</button>
    </form>
  );
}
