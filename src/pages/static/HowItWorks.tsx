import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Headphones, ShieldCheck } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import CompactPageHeader from '@/shared/components/CompactPageHeader';
import { JOURNEY_STEPS } from '@/pages/home/components/MarketplaceSections';
import './HowItWorks.css';

const DETAILS = [
  {
    eyebrow: 'Choose with confidence', heading: 'Your next identity starts with a clear choice.',
    paragraphs: ['Explore the catalog, compare the patterns you like, and open a number to review its price and readiness. A memorable number should suit the way you live, work, and connect.', 'When you are ready, review the checkout summary, apply an eligible coupon, and check the final amount before paying. Your account keeps the order details together so you can follow what happens next.'],
    points: ['Review the number, offer price, and readiness.', 'Keep your order reference for support.'],
    action: 'Explore VIP numbers', to: '/shop', caption: 'A clear checkout. A confident first step.',
  },
  {
    eyebrow: 'Get ready to transfer', heading: 'The right information for your next step.',
    paragraphs: ['After your order is confirmed, follow the guidance provided for your number. The Unique Porting Code (UPC) and transfer instructions help you move into the porting stage when your order is ready.', 'Check the instructions carefully and keep the code secure. Readiness and operator eligibility can affect the next step, so contact our team if anything in the order guidance needs clarification.'],
    points: ['Follow the UPC and readiness guidance for your order.', 'Share transfer information only where required.'],
    action: 'Ask about your order', to: '/contact', caption: 'Guidance that keeps your journey moving.',
  },
  {
    eyebrow: 'Make the move', heading: 'Bring your number to your chosen network.',
    paragraphs: ['Take the supplied transfer guidance to your chosen mobile operator and begin the Mobile Number Portability (MNP) process. The operator will confirm the documents and checks needed for your request.', 'Keep your order information available and follow the operator’s instructions throughout the transfer. Porting schedules and eligibility are controlled by the operator; our team can help you understand your order’s next step.'],
    points: ['Complete the required operator identity checks.', 'Follow the confirmed porting instructions and timeline.'],
    action: 'Get transfer support', to: '/contact', caption: 'A supported path to your preferred network.',
  },
  {
    eyebrow: 'Ready to connect', heading: 'Turn a memorable number into your everyday connection.',
    paragraphs: ['Once your operator confirms the transfer, follow its instructions to activate the new SIM. Complete any remaining verification before using your premium number.', 'Check that calls and messages work as expected after activation. If you encounter a fulfilment issue, keep the order reference and relevant details ready so our support team can help you with the next step.'],
    points: ['Wait for your operator’s activation confirmation.', 'Check your new SIM’s calling and messaging services.'],
    action: 'Contact activation support', to: '/contact', caption: 'Your number. Your identity. Ready to use.',
  },
  {
    eyebrow: 'Support you can reach', heading: 'Clear assistance, even when something needs attention.',
    paragraphs: ['If fulfilment fails because of number availability, delivery, UPC handling, or activation, contact our team with your order details. Eligible failures are reviewed for a full refund under the Refund and Cancellation Policy.', 'Pre-book cancellation requests can be made within 48 hours of booking confirmation. Refund eligibility depends on the recorded issue and policy; approved refund timing also depends on the payment provider and your bank.'],
    points: ['Tell support about the issue with your order reference.', 'Review the policy for eligibility and refund processing.'],
    action: 'Read the refund policy', to: '/refund-policy', caption: 'Transparent guidance and help when you need it.',
  },
];

export default function HowItWorks() {
  const reduceMotion = useReducedMotion();
  const reveal = (direction: number) => ({
    initial: reduceMotion ? false as const : { opacity: 0, x: direction * 24, y: 12 },
    whileInView: { opacity: 1, x: 0, y: 0 },
    viewport: { once: true, amount: .18 },
    transition: { duration: reduceMotion ? 0 : .65, ease: [0.16, 1, 0.3, 1] as const },
  });
  return (
    <main className="how-it-works compact-content-page overflow-hidden bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 pt-4"><CompactPageHeader title="How it works" subtitle="A clear path from choosing your number to activation." icon={ShieldCheck} action={<Link to="/shop" className="btn-gold min-h-9 text-xs">Find your number <ArrowRight className="h-3 w-3" /></Link>} /></div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {JOURNEY_STEPS.map((step, index) => {
          const detail = DETAILS[index];
          return (
            <section key={step.title} className={`how-step ${index % 2 ? 'how-step--reverse' : ''}`} aria-labelledby={`journey-step-${index}`}>
              <motion.div className="how-step__details" {...reveal(index % 2 ? 1 : -1)}>
                <div className="mb-3 flex items-center gap-3 text-xs font-black uppercase tracking-wider text-primary"><span className="grid h-8 w-8 place-items-center rounded-full border border-primary/30 bg-primary/10">0{index + 1}</span>{detail.eyebrow}</div>
                <h2 id={`journey-step-${index}`} className="text-2xl font-black leading-tight sm:text-3xl">{detail.heading}</h2>
                <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">{detail.paragraphs.map(text => <p key={text}>{text}</p>)}</div>
                <ul className="my-5 space-y-2">{detail.points.map(point => <li key={point} className="flex items-start gap-2 text-sm font-semibold"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{point}</li>)}</ul>
                <Link to={detail.to} className="how-step__link inline-flex min-h-10 items-center gap-2 text-sm font-black text-primary">{detail.action}<ArrowRight className="h-4 w-4" /></Link>
              </motion.div>
              <motion.article className="how-step__card rounded-2xl border border-border bg-card p-5 shadow-sm" {...reveal(index % 2 ? -1 : 1)}>
                <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><step.icon className="h-5 w-5" /></span><div><span className="text-[10px] font-black uppercase tracking-wider text-primary">Stage {index + 1}</span><h3 className="text-lg font-black">{step.title}</h3></div></div>
                <div className="how-step__art mt-4"><span className="how-step__halo" aria-hidden="true" /><motion.img src={step.image} alt="" width="1254" height="1254" loading={index === 0 ? 'eager' : 'lazy'} decoding="async" className="relative z-10 h-full w-full object-contain" whileHover={reduceMotion ? undefined : { y: -6, rotate: index % 2 ? -1 : 1 }} transition={{ duration: .4 }} /></div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{index === 4 ? 'Full-refund review for eligible fulfilment failures under our Refund and Cancellation Policy.' : step.text}</p>
                <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-xs font-bold"><CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />{detail.caption}</div>
              </motion.article>
            </section>
          );
        })}
      </div>

      <section className="px-4 pb-8 sm:px-6 lg:px-8">
        <div className="public-feature-card mx-auto flex max-w-6xl flex-wrap items-center gap-4 rounded-2xl border border-primary/30 bg-card p-4 shadow-sm sm:p-4">
          <Headphones className="h-7 w-7 text-primary" /><div className="min-w-0 flex-1"><h2 className="text-lg font-black">Support throughout your journey</h2><p className="text-sm leading-6 text-muted-foreground">Operator eligibility and verification can vary. Ask our team about your next step.</p></div>
          <Link to="/contact" className="btn-gold">Contact support <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </main>
  );
}
