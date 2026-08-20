import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Crown,
  Headphones,
  Lock,
  MessageCircle,
  PackageCheck,
  Phone,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
  WalletCards,
} from 'lucide-react';
import { useInView } from 'framer-motion';
import NumberCard, { NumberItem } from '@/shared/components/NumberCard';
import { Loader } from '@/shared/components/ui-bits';
import { Logo, Slogan } from '@/shared/components/Logo';
import type { NumberCategory } from '@/core/categories/types';
import { getCategoryCount } from '@/core/categories/types';
import { cn } from '@/core/lib/utils';
import { CategoryGrid } from '@/shared/components/categories/CategoryCard';
import { MotionGrid, MotionGridItem, MotionSection, motion, useReducedMotion } from '@/shared/motion/MotionPrimitives';
import type { DealOfDayItem } from '@/core/api/vnwAPI';
import DealOfDayShowcase from './DealOfDayShowcase';

export interface HomeTestimonial {
  testimonial_id?: number;
  name?: string;
  role?: string;
  content?: string;
  rating?: number;
}

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
const primaryButton = cn(
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90',
  focusRing,
);
const secondaryButton = cn(
  'vnw-interactive inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-bold text-foreground shadow-sm',
  focusRing,
);
const mutedCard = 'rounded-2xl border border-border bg-card shadow-sm';

export const popularPatterns = [
  { label: '9999', to: '/shop?q=9999', helper: 'Repeating pattern' },
  { label: '7777', to: '/shop?q=7777', helper: 'Lucky sequence' },
  { label: '7878', to: '/shop?q=7878', helper: 'Mirror style' },
  { label: '0001', to: '/shop?q=0001', helper: 'Low ending' },
  { label: '1234', to: '/shop?q=1234', helper: 'Sequential digits' },
  { label: 'Numerology', to: '/numerology', helper: 'Match by sum' },
];

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  centered = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  centered?: boolean;
}) {
  return (
    <div className={cn('mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between', centered && 'items-center text-center sm:items-center sm:justify-center')}>
      <div className={cn('max-w-2xl', centered && 'mx-auto')}>
        {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">{eyebrow}</p>}
        <h2 className="text-xl font-black leading-tight text-foreground sm:text-2xl">{title}</h2>
        {description && <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

const orbitCategories = [
  { label: 'Mirror', to: '/shop?category=mirror-numbers', left: '50%', top: '2%' },
  { label: 'Triple', to: '/shop?category=triple-numbers', left: '84%', top: '22%' },
  { label: 'Numerology', to: '/numerology', left: '94%', top: '55%' },
  { label: 'AB AB', to: '/shop?category=ab-ab-xy-xy-numbers', left: '79%', top: '82%' },
  { label: 'Doubling', to: '/shop?category=doubling-numbers', left: '50%', top: '98%' },
  { label: '786', to: '/shop?category=786-numbers', left: '17%', top: '82%' },
  { label: 'Counting', to: '/shop?category=counting-numbers', left: '5%', top: '54%' },
  { label: 'Unique', to: '/shop?category=unique-numbers', left: '18%', top: '22%' },
];

type HeroButterfly = {
  left: string;
  top: string;
  wings: [string, string];
  delay: string;
  duration: string;
  reverse?: boolean;
};

const heroButterflies: HeroButterfly[] = [
  { left: '92%', top: '14%', wings: ['93', '39'], delay: '-2.4s', duration: '18s' },
  { left: '50%', top: '74%', wings: ['11', '22'], delay: '-13.8s', duration: '22s' },
  { left: '14%', top: '69%', wings: ['78', '87'], delay: '-9.2s', duration: '21s', reverse: true },
  { left: '24%', top: '88%', wings: ['55', '99'], delay: '-17.2s', duration: '24s', reverse: true },
  { left: '47%', top: '40%', wings: ['7', '77'], delay: '-5.8s', duration: '19s' },
  { left: '52%', top: '14%', wings: ['108', '801'], delay: '-11.4s', duration: '23s' },
  { left: '45%', top: '82%', wings: ['99', '66'], delay: '-12.6s', duration: '23s', reverse: true },
  { left: '53%', top: '58%', wings: ['131', '313'], delay: '-19.1s', duration: '25s' },
  { left: '60%', top: '17%', wings: ['786', '687'], delay: '-7.7s', duration: '22s' },
  { left: '74%', top: '72%', wings: ['0001', '1000'], delay: '-15.4s', duration: '24s', reverse: true },
  { left: '82%', top: '10%', wings: ['909', '909'], delay: '-8.6s', duration: '21s', reverse: true },
  { left: '88%', top: '38%', wings: ['911', '1911'], delay: '-4.1s', duration: '20s', reverse: true },
  { left: '66%', top: '39%', wings: ['24', '42'], delay: '-16.6s', duration: '23s' },
  { left: '78%', top: '88%', wings: ['121', '121'], delay: '-6.9s', duration: '22s', reverse: true },
  { left: '91%', top: '67%', wings: ['999', '999'], delay: '-10.8s', duration: '24s', reverse: true },
];

function HeroButterflyLayer({ mode, butterflies = heroButterflies }: { mode: 'ambient' | 'focus'; butterflies?: HeroButterfly[] }) {
  return (
    <div className={`home-showcase__butterflies home-showcase__butterflies--${mode} pointer-events-none absolute inset-0 overflow-hidden`} aria-hidden="true">
      {butterflies.map((butterfly) => (
        <span
          key={`${mode}-${butterfly.left}-${butterfly.top}`}
          className={cn('home-hero__butterfly numeric-butterfly numeric-butterfly--background absolute', butterfly.reverse && 'home-hero__butterfly--reverse')}
          style={{
            left: butterfly.left,
            top: butterfly.top,
            animationDelay: butterfly.delay,
            animationDuration: butterfly.duration,
            '--flutter-delay': butterfly.delay,
          } as React.CSSProperties}
        >
          <span className="numeric-butterfly__wing numeric-butterfly__wing--left">{butterfly.wings[0]}</span>
          <span className="numeric-butterfly__body" />
          <span className="numeric-butterfly__wing numeric-butterfly__wing--right">{butterfly.wings[1]}</span>
        </span>
      ))}
    </div>
  );
}

export function HomeHero({
  deals,
  dealsLoading = false,
  dealsError = false,
}: {
  deals: DealOfDayItem[];
  dealsLoading?: boolean;
  dealsError?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const isInView = useInView(heroRef, { amount: 0.12 });
  const ambientMotion = isInView && !reduceMotion;
  const [orbitPaused, setOrbitPaused] = useState(false);

  return (
    <section
      ref={heroRef}
      className={cn('home-hero home-showcase relative isolate overflow-hidden px-4 py-4 sm:px-6 sm:py-4 lg:px-8 lg:py-3', ambientMotion && 'is-motion-active')}
      aria-labelledby="home-hero-title"
    >
      <div className="home-showcase__dots absolute bottom-0 left-0 h-40 w-56 opacity-50" aria-hidden="true" />
      <HeroButterflyLayer mode="ambient" />
      <HeroButterflyLayer mode="focus" />
      <div className="home-hero__grid relative mx-auto grid w-full max-w-[1700px] items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-4">
        <motion.div
          className="home-hero__copy relative z-10 mx-auto w-full max-w-[800px] lg:col-start-1 lg:row-start-1"
          initial={reduceMotion ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.48, ease: [0.16, 1, 0.3, 1] }}
        >
          <DealOfDayShowcase deals={deals} loading={dealsLoading} error={dealsError} />
        </motion.div>

        <motion.div
          className="home-hero__art brand-stage relative z-10 mx-auto aspect-[1.08/1] w-full max-w-[700px] lg:col-start-2 lg:row-start-1"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.58, delay: reduceMotion ? 0 : 0.08, ease: [0.16, 1, 0.3, 1] }}
          aria-label="Browse VIP number categories"
        >
          <div className="brand-stage__aura absolute inset-[2%] rounded-full" />
          <div className="brand-stage__orbit brand-stage__orbit--wide absolute inset-[6%] rounded-[50%]" />
          <div className="brand-stage__orbit brand-stage__orbit--mid absolute inset-[17%] rounded-full" />
          <div className="brand-stage__orbit brand-stage__orbit--inner absolute inset-[26%] rounded-full" />
          <div className="brand-stage__sparkles absolute inset-[7%] rounded-full" />

          <div className={cn('brand-stage__number-orbit absolute inset-[7%] z-30', orbitPaused && 'is-paused')}>
            {orbitCategories.map((category) => (
              <span key={category.label} className="brand-stage__number-anchor absolute" style={{ left: category.left, top: category.top }}>
                <Link
                  to={category.to}
                  className="brand-stage__category-link"
                  aria-label={`Browse ${category.label} numbers`}
                  onMouseEnter={() => setOrbitPaused(true)}
                  onMouseLeave={() => setOrbitPaused(false)}
                  onFocus={() => setOrbitPaused(true)}
                  onBlur={() => setOrbitPaused(false)}
                >
                  <span className="brand-stage__number-plaque">
                    <Crown className="brand-stage__number-crown" />
                    {category.label}
                  </span>
                </Link>
              </span>
            ))}
          </div>

          <div className="brand-stage__core absolute inset-[29%] z-20 grid place-items-center rounded-full">
            <div className="brand-stage__ticks absolute inset-[-9%] rounded-full" />
            <div className="absolute inset-[8%] rounded-full border border-amber-300 bg-white/95 shadow-[inset_0_0_35px_rgba(245,158,11,.12)]" />
            <Logo className="relative h-[62%] w-[62%]" alt="" />
          </div>

          <div className="brand-stage__pedestal absolute bottom-[3%] left-1/2 z-10 h-[15%] w-[68%] -translate-x-1/2 rounded-[50%]" />
          <div className="brand-stage__slogan absolute left-1/2 z-40 w-[55%] -translate-x-1/2 rounded-2xl border border-amber-400 bg-white px-6 py-3 shadow-[0_18px_38px_-18px_rgba(120,76,15,.4)]">
            <Slogan className="h-auto w-full" alt="" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function BudgetBandsSection() {
  const bands = [
    ['Under ₹5,000', '5000', 'Accessible fancy numbers'],
    ['Under ₹10,000', '10000', 'Popular VIP patterns'],
    ['Under ₹25,000', '25000', 'Premium combinations'],
    ['Under ₹50,000', '50000', 'Signature selections'],
  ];

  return (
    <MotionSection className="bg-card px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader eyebrow="Shop by budget" title="Find the right number faster" description="Popular price bands make a large catalogue easier to explore." />
        <MotionGrid className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {bands.map(([label, value, helper]) => (
            <MotionGridItem key={value}>
              <Link to={`/shop?price_max=${value}&sort=price_asc`} className={cn(mutedCard, 'group flex items-center gap-4 p-4 transition hover:border-primary hover:shadow-md', focusRing)}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><WalletCards className="h-5 w-5" /></span>
                <span className="min-w-0">
                  <strong className="block text-sm font-black text-foreground">{label}</strong>
                  <span className="block truncate text-xs text-muted-foreground">{helper}</span>
                </span>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
              </Link>
            </MotionGridItem>
          ))}
        </MotionGrid>
      </div>
    </MotionSection>
  );
}

export function PopularPatterns() {
  return (
    <section className="bg-background px-4 pb-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Popular patterns"
          title="Start with a memorable pattern"
          description="Quick links use existing shop routes and query parameters."
        />
        <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-6">
          {popularPatterns.map((pattern) => (
            <Link
              key={pattern.label}
              to={pattern.to}
              className={cn('min-w-[168px] rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary hover:shadow-md sm:min-w-0', focusRing)}
            >
              <span className="block text-lg font-black text-foreground">{pattern.label}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{pattern.helper}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function NumberGridSection({
  title,
  description,
  numbers,
  loading,
  error,
  emptyTitle,
  action,
}: {
  title: string;
  description?: string;
  numbers: NumberItem[];
  loading?: boolean;
  error?: string;
  emptyTitle: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader title={title} description={description} action={action} />
        {loading ? (
          <Loader variant="cards" />
        ) : error ? (
          <div className={cn(mutedCard, 'p-6 text-center')}>
            <p className="text-base font-bold text-foreground">Unable to load numbers</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          </div>
        ) : numbers.length === 0 ? (
          <div className={cn(mutedCard, 'p-8 text-center')}>
            <p className="text-base font-bold text-foreground">{emptyTitle}</p>
            <Link to="/shop" className={cn('mt-4', secondaryButton)}>
              Browse numbers
            </Link>
          </div>
        ) : (
          <div className="number-card-grid">
            {numbers.map((number) => <NumberCard key={number.number_id} item={number} />)}
          </div>
        )}
      </div>
    </section>
  );
}

export function WhyChooseSection() {
  const items = [
    [ShieldCheck, 'Verified numbers', 'Listings are presented as verified VIP, fancy, lucky, and premium mobile numbers.'],
    [Lock, 'Secure payments', 'Checkout keeps the existing secure payment flow intact.'],
    [Headphones, 'Support available', 'Contact and WhatsApp paths remain available for enquiries.'],
    [PackageCheck, 'Clear ordering', 'Product cards and detail pages keep price, status, and actions visible.'],
  ];

  return (
    <section className="bg-card px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Why choose VIP Number World"
          title="A cleaner way to shop for VIP numbers"
          description="The homepage focuses on search, clear listings, and the existing support and purchase paths."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {items.map(([Icon, title, text]: any) => (
            <div key={title} className={cn(mutedCard, 'p-5')}>
              <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
              <h3 className="mt-4 text-base font-black text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  const steps = [
    [Search, 'Find your number', 'Search by digits, pattern, budget, numerology, or plain-language intent.'],
    [ShoppingCart, 'Secure checkout', 'Review price and details, then use the existing cart and payment flow.'],
    [Headphones, 'Transfer support', 'Follow the order and support path for UPC and transfer guidance.'],
    [Phone, 'Activate your choice', 'Complete activation with your preferred mobile operator.'],
  ];

  return (
    <section className="bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="How purchasing works"
          title="Four clear steps"
          description="This explains the visible customer flow without changing the actual purchase workflow."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([Icon, title, text]: any, index) => (
            <article key={title} className={cn(mutedCard, 'p-5')}>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-sm font-black text-primary">{index + 1}</span>
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-black text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURED_CATEGORY_SLUGS = [
  'mirror-numbers',
  'semi-mirror-numbers',
  'counting-numbers',
  '786-numbers',
  'ab-ab-xy-xy-numbers',
  'triple-numbers',
  'penta-numbers',
  'without-248-numbers',
];

export function CategorySection({ categories, loading = false }: { categories: NumberCategory[]; loading?: boolean }) {
  const normalized = categories.filter((category) => category?.name && category?.slug);
  const available = normalized.filter((category) => getCategoryCount(category) > 0);
  const pool = available.length ? available : normalized;
  const bySlug = new Map(pool.map((category) => [category.slug, category]));
  const selected: NumberCategory[] = [];

  for (const slug of FEATURED_CATEGORY_SLUGS) {
    const category = bySlug.get(slug);
    if (category) selected.push(category);
  }
  for (const category of pool) {
    if (selected.length >= 8) break;
    if (!selected.some((item) => item.slug === category.slug)) selected.push(category);
  }

  if (loading) {
    return (
      <section data-home-category-section className="bg-card px-4 py-8 sm:px-6 lg:px-8" aria-label="Loading number categories" aria-busy="true">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 h-8 w-72 max-w-full animate-pulse rounded bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="min-h-[154px] animate-pulse rounded-2xl border border-border bg-background p-4 shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-muted" />
                <div className="mt-4 h-4 w-2/3 rounded bg-muted" />
                <div className="mt-3 h-3 w-1/2 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!selected.length) {
    return (
      <section data-home-category-section className="bg-card px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Number categories"
            title="Explore every VIP pattern"
            description="Browse all available numbers or discover the complete automatic category catalog."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['All VIP numbers', '/shop', 'Browse the full marketplace.'],
              ['Number categories', '/categories', 'Explore all automatically detected patterns.'],
              ['Numerology', '/numerology', 'Use the existing numerology page.'],
            ].map(([title, to, text]) => (
              <Link key={title} to={to} className={cn(mutedCard, 'block p-5 transition hover:border-primary', focusRing)}>
                <h3 className="text-base font-black text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section data-home-category-section className="bg-card px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Number categories"
          title="Find your perfect number pattern"
          description="Each number is analysed automatically and assigned to its strongest matching pattern."
          action={
            <Link to="/categories" className={secondaryButton}>
              View all categories <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        />
        <CategoryGrid categories={selected} compact />
      </div>
    </section>
  );
}

export function ServiceCoverageSection() {
  return (
    <section className="bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">Service coverage</p>
            <h2 className="mt-2 text-2xl font-black text-foreground">Pan India delivery and support</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              VIP Number World currently presents pan-India delivery and support contact paths through the existing site content and layout.
            </p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:mt-0 lg:w-[420px]">
            <div className="rounded-xl bg-muted p-4">
              <Truck className="h-5 w-5 text-primary" aria-hidden="true" />
              <p className="mt-2 text-sm font-bold text-foreground">Pan India delivery</p>
            </div>
            <div className="rounded-xl bg-muted p-4">
              <Headphones className="h-5 w-5 text-primary" aria-hidden="true" />
              <p className="mt-2 text-sm font-bold text-foreground">Support contact available</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSection({ testimonials }: { testimonials: HomeTestimonial[] }) {
  const visible = testimonials.filter((testimonial) => testimonial?.content || testimonial?.name).slice(0, 3);
  if (!visible.length) return null;

  return (
    <section id="testimonials" className="bg-card px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader centered eyebrow="Testimonials" title="Customer feedback" description="Showing testimonials returned by the existing API." />
        <div className="grid gap-4 md:grid-cols-3">
          {visible.map((testimonial, index) => (
            <article key={testimonial.testimonial_id || index} className={cn(mutedCard, 'p-5')}>
              {testimonial.rating ? (
                <p className="mb-3 text-sm font-bold text-primary" aria-label={`${testimonial.rating} out of 5 stars`}>
                  {testimonial.rating}/5 rating
                </p>
              ) : null}
              {testimonial.content && <p className="text-sm leading-6 text-foreground">"{testimonial.content}"</p>}
              <div className="mt-4 border-t border-border pt-4">
                <p className="font-black text-foreground">{testimonial.name || 'Customer'}</p>
                {testimonial.role && <p className="text-sm text-muted-foreground">{testimonial.role}</p>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalEnquiryCta({ whatsapp }: { whatsapp?: string }) {
  const cleanWhatsapp = (whatsapp || '').replace(/\D/g, '');
  const whatsappHref = cleanWhatsapp
    ? `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent('Hi! I am interested in a VIP number.')}`
    : undefined;

  return (
    <section className="bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-wide text-primary">Need help choosing?</p>
        <h2 className="mt-2 text-2xl font-black text-foreground sm:text-3xl">Search the marketplace or send an enquiry</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Use the existing shop search, contact page, or WhatsApp enquiry path to continue.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/shop" className={primaryButton}>
            Browse VIP numbers
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          {whatsappHref ? (
            <a href={whatsappHref} target="_blank" rel="noreferrer" className={secondaryButton}>
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp enquiry
            </a>
          ) : (
            <Link to="/contact" className={secondaryButton}>
              Contact us
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
