import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Search, Heart, ShoppingCart, User, LogOut, LayoutDashboard, Phone, MessageCircle,
  ChevronUp, Facebook, Instagram, Youtube, Mail, Globe, MapPin, Bell, Menu, X, Sparkles, Crown,
} from 'lucide-react';
import { useStore } from '@/shared/store/useStore';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { logout } from '@/app/authSlice';
import { localService } from '@/core/services/local';
import { APP_CONFIG } from '@/core/config/app.config';
import BottomNav from './BottomNav';
import NewsletterForm from '@/shared/components/NewsletterForm';
import { Logo as BrandLogo, Slogan } from '@/shared/components/Logo';
import { ThemeControl } from '@/shared/components/ThemeControl';
import { AnimatePresence, motion } from 'framer-motion';
import { MotionPage } from '@/shared/motion/MotionPrimitives';

function Logo() {
  return (
    <Link to="/" className="relative z-10 flex min-w-0 shrink items-center gap-1.5 rounded-xl sm:gap-2 dark:bg-[#fbfaf7]/95 dark:px-1.5 dark:py-1">
      <BrandLogo className="h-10 w-10 shrink-0 object-contain sm:h-12 sm:w-12" />
      <Slogan className="block h-8 w-[132px] min-w-0 translate-y-1 object-contain sm:h-10 sm:w-[165px] xl:w-[155px] 2xl:w-[195px]" />
    </Link>
  );
}

function CountBadge({ n }: { n: number }) {
  if (!n) return null;
  return <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-amber-700 px-1 text-[9px] font-bold text-white">{n}</span>;
}

const NUMBER_CATS = [
  { label: 'All VIP Numbers', to: '/shop' },
  { label: 'Premium Numbers', to: '/shop?category=premium' },
  { label: 'Numerology', to: '/numerology' },
  { label: 'Family Packs', to: '/shop?category=family' },
];

const HEADER_BUTTERFLIES = [
  { left: '5%', top: '62%', wings: ['93', '39'], delay: '-1.2s', duration: '15.5s' },
  { left: '34%', top: '18%', wings: ['78', '87'], delay: '-6.4s', duration: '17s' },
  { left: '64%', top: '68%', wings: ['7', '7'], delay: '-10.1s', duration: '14.8s' },
];

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { cartCount, wishlistCount, refreshCounts } = useStore();
  const { user } = useAppSelector((s) => s.auth);
  const token = localService.getToken();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => { if (token) refreshCounts(); }, [token]);
  useEffect(() => {
    const updateHeaderState = () => setIsScrolled(window.scrollY > 16);
    updateHeaderState();
    window.addEventListener('scroll', updateHeaderState, { passive: true });
    return () => window.removeEventListener('scroll', updateHeaderState);
  }, []);
  const dash = user?.role === 'ADMIN' ? '/admin' : user?.role === 'DEALER' ? '/dealer' : '/dashboard';
  const nav = [
    { label: 'Home', to: '/' },
    { label: 'How It Works', to: '/about' },
    { label: 'About Us', to: '/about' },
    { label: 'Testimonials', to: '/#testimonials' },
    { label: 'Contact', to: '/contact' },
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate(`/shop?q=${encodeURIComponent(q.trim())}`);
    else navigate('/shop');
    setOpen(false);
  };

  const AccountMenu = (
    token && user ? (
      <div className="group relative">
        <button aria-label="Open account menu" className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-foreground shadow-sm transition hover:border-primary hover:bg-accent"><User className="h-5 w-5" /></button>
        <div className="invisible absolute right-0 top-full w-52 pt-3 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
          <div className="glass-panel rounded-xl p-2">
            <div className="px-3 py-2 text-xs text-muted-foreground">Hi, {(user.name || 'User').split(' ')[0]}</div>
            <Link to={dash} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent"><LayoutDashboard className="h-4 w-4 text-primary" /> Dashboard</Link>
            <Link to="/orders" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent"><ShoppingCart className="h-4 w-4 text-primary" /> My Orders</Link>
            <Link to="/account" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent"><User className="h-4 w-4 text-primary" /> Profile</Link>
            <button onClick={() => dispatch(logout())} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"><LogOut className="h-4 w-4" /> Logout</button>
          </div>
        </div>
      </div>
    ) : (
      <>
        <Link to="/login" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card/85 px-3 py-2 text-xs font-bold text-foreground shadow-sm transition hover:border-primary hover:bg-accent 2xl:px-4 2xl:text-sm"><User className="h-5 w-5" />Sign In</Link>
        <Link to="/register" className="public-header__register inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-white shadow-[0_10px_22px_-12px_rgba(63,21,133,.8)] transition hover:-translate-y-0.5 2xl:px-4 2xl:text-sm"><Crown className="h-5 w-5 text-amber-300" />Register</Link>
      </>
    )
  );

  const MobileAccount = (
    token && user ? (
      <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-muted p-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-foreground text-sm font-black text-background">
            {(user.name || 'U').slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-black text-foreground">Hi, {(user.name || 'User').split(' ')[0]}</div>
            <div className="truncate text-xs text-muted-foreground">{user.email || user.phone || 'Welcome back'}</div>
          </div>
        </div>
        <div className="grid gap-1">
          <Link to={dash} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-foreground hover:bg-accent"><LayoutDashboard className="h-4 w-4 text-primary" /> Dashboard</Link>
          <Link to="/orders" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-foreground hover:bg-accent"><ShoppingCart className="h-4 w-4 text-primary" /> My Orders</Link>
          <Link to="/account" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-foreground hover:bg-accent"><User className="h-4 w-4 text-primary" /> Profile</Link>
          <button onClick={() => { dispatch(logout()); setOpen(false); }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-destructive hover:bg-destructive/10"><LogOut className="h-4 w-4" /> Logout</button>
        </div>
      </div>
    ) : (
      <div className="grid grid-cols-2 gap-2">
        <Link to="/login" onClick={() => setOpen(false)} className="rounded-xl border border-border bg-card px-4 py-3 text-center text-sm font-black text-foreground shadow-sm">Sign In</Link>
        <Link to="/register" onClick={() => setOpen(false)} className="rounded-xl bg-foreground px-4 py-3 text-center text-sm font-black text-background">Register</Link>
      </div>
    )
  );

  return (
    <>
      <header
        className={`public-header ${isScrolled ? 'is-scrolled' : 'is-top'} fixed inset-x-0 top-0 z-50`}
        data-scrolled={isScrolled}
      >
        <div className="public-header__panel relative isolate mx-auto flex min-h-[72px] w-full max-w-[1880px] items-center gap-1.5 overflow-visible px-3 py-1.5 sm:px-4">
          <div className="public-header__butterflies pointer-events-none absolute inset-0 z-0" aria-hidden="true">
            {HEADER_BUTTERFLIES.map((butterfly) => (
              <span
                key={`${butterfly.left}-${butterfly.top}`}
                className="header-hero-butterfly numeric-butterfly numeric-butterfly--background absolute"
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
          <Logo />
          <nav className="relative z-10 ml-auto hidden min-w-0 flex-nowrap items-center gap-0 whitespace-nowrap text-xs font-bold text-foreground xl:flex 2xl:gap-1 2xl:text-sm" aria-label="Primary navigation">
            <Link
              to="/"
              aria-current={location.pathname === '/' ? 'page' : undefined}
              className={location.pathname === '/'
                ? 'rounded-xl border border-primary/30 bg-primary/10 px-2.5 py-2.5 text-primary shadow-sm 2xl:px-3.5'
                : 'rounded-xl px-2.5 py-2.5 transition hover:bg-accent hover:text-primary 2xl:px-3.5'}
            >
              Home
            </Link>
            <div className="group relative">
              <button className="rounded-xl px-2.5 py-2.5 transition hover:bg-accent hover:text-primary 2xl:px-3.5">Explore</button>
              <div className="invisible absolute left-0 top-full z-50 w-56 pt-4 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                <div className="glass-panel rounded-xl p-2">
                  {NUMBER_CATS.map((c) => <Link key={c.label} to={c.to} className="block rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-primary">{c.label}</Link>)}
                </div>
              </div>
            </div>
            {nav.slice(1).map((n) => <Link key={n.label} to={n.to} className="rounded-xl px-2.5 py-2.5 transition hover:bg-accent hover:text-primary 2xl:px-3.5">{n.label}</Link>)}
          </nav>
          <div className="relative z-10 ml-auto flex shrink-0 items-center gap-1 xl:ml-2 2xl:gap-1.5">
            <Link to="/shop" className="hidden h-11 items-center gap-1.5 rounded-xl border border-primary bg-card/85 px-3 text-xs font-black text-primary shadow-sm transition hover:bg-accent xl:inline-flex 2xl:text-sm"><Search className="h-5 w-5" /> Search</Link>
            <Link to="/wishlist" aria-label="Wishlist" className="relative hidden h-11 w-11 place-items-center rounded-xl border border-border bg-card/85 text-foreground shadow-sm transition hover:border-primary hover:bg-accent md:grid"><Heart className="h-5 w-5" /><CountBadge n={wishlistCount} /></Link>
            <Link to="/cart" aria-label="Cart" className="relative grid h-11 w-11 place-items-center rounded-xl border border-border bg-card/85 text-foreground shadow-sm transition hover:border-primary hover:bg-accent"><ShoppingCart className="h-5 w-5" /><CountBadge n={cartCount} /></Link>
            <button aria-label="Notifications" className="relative hidden h-11 w-11 place-items-center rounded-xl border border-border bg-card/85 text-foreground shadow-sm transition hover:border-primary hover:bg-accent md:grid"><Bell className="h-5 w-5" /><span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-amber-600" /></button>
            <ThemeControl className="hidden sm:inline-flex" />
            <div className="hidden items-center gap-2 sm:flex">{AccountMenu}</div>
            <button onClick={() => setOpen(true)} aria-label="Open navigation menu" className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-card/85 text-foreground shadow-sm transition hover:border-primary hover:bg-accent xl:hidden"><Menu className="h-5 w-5" /></button>
          </div>
        </div>
      </header>

      <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] xl:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="absolute inset-0 bg-stone-950/35" onClick={() => setOpen(false)} />
          <motion.div
            className="glass-panel absolute right-3 top-3 flex max-h-[calc(100vh-1.5rem)] w-[min(360px,calc(100vw-1.5rem))] flex-col rounded-xl p-4"
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <Logo />
              <div className="ml-auto flex items-center gap-2">
                <ThemeControl />
                <button onClick={() => setOpen(false)} aria-label="Close navigation menu" className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-foreground"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <form onSubmit={submit} className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
              <Search className="h-4 w-4 text-primary" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dream number..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            </form>
            <div className="grid gap-2">
              {[{ label: 'Home', to: '/' }, { label: 'Explore Numbers', to: '/shop' }, { label: 'Numerology', to: '/numerology' }, { label: 'How It Works', to: '/about' }, { label: 'About Us', to: '/about' }, { label: 'Contact Us', to: '/contact' }].map((n) => (
                <Link key={n.label} to={n.to} onClick={() => setOpen(false)} className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground shadow-sm hover:border-primary hover:bg-accent">{n.label}</Link>
              ))}
            </div>
            <div className="mt-4 sm:hidden">{MobileAccount}</div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
}

function Footer() {
  return (
    <footer className="px-3 pb-3">
      <div className="glass-panel relative isolate mx-auto max-w-7xl overflow-hidden rounded-[1.5rem]">
        <div className="footer__butterflies pointer-events-none absolute inset-0 z-0" aria-hidden="true">
          {HEADER_BUTTERFLIES.map((butterfly) => (
            <span
              key={`footer-${butterfly.left}-${butterfly.top}`}
              className="header-hero-butterfly numeric-butterfly numeric-butterfly--background absolute"
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
        <div className="relative z-10 grid gap-6 px-6 py-8 md:grid-cols-[1.1fr_1fr] lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">India's trusted VIP number marketplace with genuine numbers, secure payments, and pan-India delivery.</p>
            <div className="mt-4 flex gap-2">
              {[Facebook, Instagram, MessageCircle, Youtube].map((I, i) => <span key={i} className="grid h-10 w-10 place-items-center rounded-2xl bg-card/70 text-primary shadow-sm"><I className="h-4 w-4" /></span>)}
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-black text-foreground">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/shop">VIP Numbers</Link></li>
              <li><Link to="/numerology">Numerology</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-black text-foreground">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {APP_CONFIG.contactPhone}</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> {APP_CONFIG.contactEmail}</li>
              <li className="flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> vipnumberworld.com</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Pan India Delivery</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-black text-foreground">Exclusive Drops</h4>
            <p className="mb-3 text-sm text-muted-foreground">Get premium number alerts and limited deals.</p>
            <NewsletterForm />
          </div>
        </div>
        <div className="relative z-10 flex flex-col items-center justify-between gap-3 border-t border-border px-6 py-4 text-xs text-muted-foreground sm:flex-row">
          <span>&copy; {new Date().getFullYear()} VNW - VIP Number World. All rights reserved.</span>
          <span className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-[#d923c6]" /> Follow Us</span>
        </div>
      </div>
    </footer>
  );
}

function PromoBar() {
  const { site } = useStore();
  const [hidden, setHidden] = useState(() => sessionStorage.getItem('vnw_promo_hidden') === '1');
  const text = site.PROMO_TEXT;
  if (hidden || !text) return null;
  return (
    <div className="px-3 pt-2">
      <div className="relative mx-auto max-w-7xl rounded-2xl border border-border bg-accent px-8 py-2 text-center text-xs font-black text-accent-foreground shadow-sm sm:text-sm">
        <Link to="/shop?badge=HOT_DEAL">{text}</Link>
        <button onClick={() => { setHidden(true); sessionStorage.setItem('vnw_promo_hidden', '1'); }}
          className="absolute right-5 text-accent-foreground/70 hover:text-accent-foreground">x</button>
      </div>
    </div>
  );
}

function FloatingActions() {
  const { site } = useStore();
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener('scroll', onScroll); return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const wa = (site.WHATSAPP || '').replace(/\D/g, '');
  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-2 lg:bottom-6">
      {showTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top"
          className="grid h-11 w-11 place-items-center rounded-2xl border border-border bg-card/85 text-primary shadow-lg backdrop-blur">
          <ChevronUp className="h-5 w-5" />
        </button>
      )}
      {wa && (
        <a href={`https://wa.me/${wa}?text=${encodeURIComponent('Hi! I am interested in a VIP number.')}`} target="_blank" rel="noreferrer"
          aria-label="WhatsApp" className="ripple grid h-12 w-12 place-items-center rounded-2xl bg-[#25D366] text-white shadow-lg">
          <MessageCircle className="h-6 w-6" />
        </a>
      )}
    </div>
  );
}

export default function PublicLayout() {
  const { loadSite, siteLoaded } = useStore();
  const location = useLocation();
  useEffect(() => { if (!siteLoaded) loadSite(); }, []);
  return (
    <div className={`app-shell-bg flex min-h-screen flex-col ${location.pathname === '/' ? 'is-home-route' : ''}`}>
      <Header />
      <div className="pt-[72px]">
        <PromoBar />
      </div>
      <main className="flex-1 pb-20 lg:pb-0">
        <MotionPage routeKey={location.pathname + location.search}>
          <Outlet />
        </MotionPage>
      </main>
      <Footer />
      <FloatingActions />
      <BottomNav />
    </div>
  );
}
