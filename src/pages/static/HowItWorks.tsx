import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Headphones, Search, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { JOURNEY_STEPS } from '@/pages/home/components/MarketplaceSections';

export default function HowItWorks() {
  return (
    <main className="overflow-hidden bg-background text-foreground">
      <section className="public-page-hero relative border-b border-border bg-card px-4 py-10 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/.14),transparent_52%)]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-black uppercase tracking-[.15em] text-primary"><ShieldCheck className="h-4 w-4" /> Premium number journey</span>
          <h1 className="mt-5 text-4xl font-black sm:text-5xl">A clear path from selection to activation</h1>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-muted-foreground">Understand what happens after you find your VIP number and how our support path helps you complete each stage.</p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row"><Link to="/shop" className="btn-gold">Find your number <Search className="h-4 w-4" /></Link><Link to="/contact" className="btn-gold-outline">Ask a question <ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {JOURNEY_STEPS.map((step, index) => (
            <motion.article key={step.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .3 }} className={`grid gap-6 rounded-3xl border border-border bg-card p-6 shadow-sm md:grid-cols-[180px_1fr] md:items-center ${index % 2 ? 'md:grid-cols-[1fr_180px]' : ''}`}>
              <div className={`grid min-h-40 place-items-center rounded-2xl bg-primary/10 ${index % 2 ? 'md:order-2' : ''}`}><span className="relative grid h-24 w-24 place-items-center rounded-full border border-primary/30 bg-background text-primary shadow-lg"><step.icon className="h-10 w-10" /><span className="absolute -right-2 -top-2 grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-black text-primary-foreground">{index + 1}</span></span></div>
              <div>
                <div className="text-xs font-black uppercase tracking-[.15em] text-primary">Stage {index + 1}</div>
                <h2 className="mt-2 text-2xl font-black">{step.title}</h2>
                <p className="mt-3 leading-7 text-muted-foreground">{step.text}</p>
                <div className="mt-4 flex items-center gap-2 text-sm font-bold text-foreground"><CheckCircle2 className="h-4 w-4 text-primary" /> Status remains visible in your account and order history.</div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-primary/30 bg-card p-8 text-center shadow-lg">
          <Headphones className="mx-auto h-9 w-9 text-primary" /><h2 className="mt-3 text-2xl font-black">Support throughout your journey</h2><p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Operator eligibility and verification requirements can vary. Contact our team whenever you need help understanding the next step.</p>
          <Link to="/contact" className="btn-gold mt-6">Contact support <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </main>
  );
}
