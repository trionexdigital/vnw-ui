import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  BadgeIndianRupee,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { BrandLockup } from '@/shared/components/Logo';
import { contactAPI } from '@/core/api/vnwAPI';
import { APP_CONFIG } from '@/core/config/app.config';
import { useToast } from '@/shared/hooks/use-toast';
import { useStore } from '@/shared/store/useStore';
import { MotionGrid, MotionGridItem, MotionReveal, MotionSection } from '@/shared/motion/MotionPrimitives';

const inputClass = 'w-full rounded-xl border border-card-border bg-secondary/70 px-3.5 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15';

export default function About() {
  const { toast } = useToast();
  const { site } = useStore();
  const location = useLocation();
  const [params] = useSearchParams();
  const requestedSubject = params.get('subject')?.replaceAll('-', ' ') || '';
  const [form, setForm] = useState({ name: '', email: '', subject: requestedSubject, message: '' });
  const [busy, setBusy] = useState(false);

  const contact = useMemo(() => ({
    email: site.CONTACT_EMAIL || APP_CONFIG.contactEmail,
    phone: site.CONTACT_PHONE || APP_CONFIG.contactPhone,
    whatsapp: site.WHATSAPP || APP_CONFIG.whatsapp,
    address: site.SUPPORT_ADDRESS || site.LEGAL_REGISTERED_ADDRESS || 'India',
  }), [site]);

  useEffect(() => {
    if (location.hash !== '#contact') return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById('contact')?.scrollIntoView({ block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await contactAPI.submit(form);
      if (response?.status !== 1) throw new Error(response?.info || 'Unable to send your message');
      toast({ title: 'Message sent', description: response.info });
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (error: any) {
      toast({ title: 'Message not sent', description: error.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const whatsappDigits = contact.whatsapp.replace(/\D/g, '');
  const phoneDigits = contact.phone.replace(/[^\d+]/g, '');
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(contact.address)}&output=embed`;

  const details = [
    { icon: Mail, label: 'Email us', value: contact.email, href: `mailto:${contact.email}` },
    { icon: Phone, label: 'Call us', value: contact.phone, href: `tel:${phoneDigits}` },
    { icon: MessageCircle, label: 'WhatsApp', value: `+${whatsappDigits}`, href: `https://wa.me/${whatsappDigits}` },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
      <MotionReveal className="text-center">
        <BrandLockup className="justify-center" logoClassName="h-14 w-14" sloganClassName="h-12 w-64 max-w-[70vw]" />
        <h1 className="mt-5 text-3xl font-extrabold sm:text-4xl" style={{ fontFamily: 'Playfair Display, serif' }}>
          About <span className="text-gold">VIP Number World</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          We help people discover genuine VIP, fancy, and lucky mobile numbers that feel personal and memorable.
          From secure purchase to activation support, our team keeps every step simple and transparent.
        </p>
      </MotionReveal>

      <MotionGrid className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: ShieldCheck, title: 'Genuine & Verified', description: 'Numbers are checked before they are listed.' },
          { icon: BadgeIndianRupee, title: 'Clear Pricing', description: 'Straightforward offers with no hidden surprises.' },
          { icon: Lock, title: 'Secure Payments', description: 'Protected online payments powered by Razorpay.' },
          { icon: RefreshCw, title: 'Activation Support', description: 'Helpful guidance through transfer and activation.' },
        ].map((feature) => (
          <MotionGridItem key={feature.title}>
            <div className="vnw-card h-full p-5 transition-colors hover:border-primary/45 focus-within:border-primary/45">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
                <feature.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-bold text-foreground">{feature.title}</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{feature.description}</p>
            </div>
          </MotionGridItem>
        ))}
      </MotionGrid>

      <MotionSection id="contact" className="scroll-mt-28 pt-14 sm:pt-16">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">We are here to help</p>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl" style={{ fontFamily: 'Playfair Display, serif' }}>
            Contact <span className="text-gold">our team</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Ask about a VIP number, an existing order, activation, or becoming a dealer.
          </p>
        </div>

        <div className="mt-8 grid items-stretch gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <MotionGrid className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {details.map((detail) => (
                <MotionGridItem key={detail.label}>
                  <a
                    href={detail.href}
                    target={detail.label === 'WhatsApp' ? '_blank' : undefined}
                    rel={detail.label === 'WhatsApp' ? 'noreferrer' : undefined}
                    className="vnw-card vnw-interactive flex min-h-20 items-center gap-3 p-4 text-foreground"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
                      <detail.icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs text-muted-foreground">{detail.label}</span>
                      <span className="block truncate text-sm font-bold">{detail.value}</span>
                    </span>
                  </a>
                </MotionGridItem>
              ))}
            </MotionGrid>

            <div className="vnw-card overflow-hidden p-2">
              <div className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-foreground">
                <MapPin className="h-4 w-4 text-primary" /> Our service location
                <span className="ml-auto truncate text-xs font-normal text-muted-foreground">{contact.address}</span>
              </div>
              <iframe
                title="VIP Number World location map"
                src={mapUrl}
                className="h-64 w-full rounded-2xl border-0 sm:h-72"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <form onSubmit={submit} className="vnw-card flex h-full flex-col p-5 sm:p-7">
            <div className="mb-5">
              <h3 className="text-xl font-black text-foreground">Send us a message</h3>
              <p className="mt-1 text-sm text-muted-foreground">Share a few details and our support team will get back to you.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold text-foreground">
                Your name
                <input required autoComplete="name" placeholder="Enter your name" className={`${inputClass} mt-1.5`} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </label>
              <label className="text-sm font-bold text-foreground">
                Email address
                <input required type="email" autoComplete="email" placeholder="you@example.com" className={`${inputClass} mt-1.5`} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </label>
            </div>
            <label className="mt-4 text-sm font-bold text-foreground">
              Subject
              <input placeholder="How can we help?" className={`${inputClass} mt-1.5`} value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} />
            </label>
            <label className="mt-4 flex flex-1 flex-col text-sm font-bold text-foreground">
              Message
              <textarea required rows={6} placeholder="Write your message here..." className={`${inputClass} mt-1.5 min-h-36 flex-1 resize-y`} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
            </label>
            <button disabled={busy} className="btn-gold mt-5 w-full disabled:cursor-not-allowed disabled:opacity-60">
              <Send className="h-4 w-4" /> {busy ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        </div>
      </MotionSection>

      <MotionReveal className="vnw-card mt-10 p-6 text-center sm:p-8">
        <h2 className="text-2xl font-bold text-gold">Are you a dealer?</h2>
        <p className="mt-2 text-sm text-muted-foreground">List premium numbers, reach more buyers, and manage every sale in one place.</p>
        <Link to="/register?role=DEALER" className="btn-gold mt-5 inline-flex">Become a Dealer</Link>
      </MotionReveal>
    </main>
  );
}
