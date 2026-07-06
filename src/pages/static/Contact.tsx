import { useState } from 'react';
import { Mail, Phone, MessageCircle, Send } from 'lucide-react';
import { contactAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { APP_CONFIG } from '@/core/config/app.config';

export default function Contact() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await contactAPI.submit(form);
      if (res?.status === 1) { toast({ title: 'Message sent', description: res.info }); setForm({ name: '', email: '', subject: '', message: '' }); }
      else throw new Error(res?.info || 'Failed');
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  const input = 'w-full rounded-lg border border-card-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-primary';

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-center text-4xl font-extrabold" style={{ fontFamily: 'Playfair Display, serif' }}>Get in <span className="text-gold">Touch</span></h1>
      <p className="mt-3 text-center text-muted-foreground">Questions about a number or your order? We're here to help.</p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-3">
          {[
            { icon: Mail, label: 'Email', value: APP_CONFIG.contactEmail },
            { icon: Phone, label: 'Phone', value: APP_CONFIG.contactPhone },
            { icon: MessageCircle, label: 'WhatsApp', value: '+' + APP_CONFIG.whatsapp },
          ].map((c) => (
            <div key={c.label} className="vnw-card flex items-center gap-3 p-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-card-border text-primary"><c.icon className="h-5 w-5" /></span>
              <div><div className="text-xs text-muted-foreground">{c.label}</div><div className="text-sm font-medium text-foreground">{c.value}</div></div>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="vnw-card space-y-3 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <input required placeholder="Your name" className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input required type="email" placeholder="Email" className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <input placeholder="Subject" className={input} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <textarea required rows={5} placeholder="Your message" className={input} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <button disabled={busy} className="btn-gold w-full"><Send className="h-4 w-4" /> {busy ? 'Sending…' : 'Send Message'}</button>
        </form>
      </div>
    </div>
  );
}
