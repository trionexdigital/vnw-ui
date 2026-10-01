import { Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Heart, ShoppingCart, ShoppingBag, User, LogOut, LayoutDashboard, Phone, MessageCircle,
  ChevronUp, Facebook, Instagram, Youtube, Mail, Globe, MapPin, GitCompareArrows, Menu, X, Sparkles, Crown, CalendarClock,
  House, BookOpen, UsersRound, Hash, PhoneCall,
} from 'lucide-react';
import { useStore } from '@/shared/store/useStore';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { logout } from '@/app/authSlice';
import { localService } from '@/core/services/local';
import { APP_CONFIG } from '@/core/config/app.config';
import BottomNav from './BottomNav';
import NewsletterForm from '@/shared/components/NewsletterForm';
import { BrandLockup } from '@/shared/components/Logo';
import UserAvatar from '@/shared/components/UserAvatar';
import { ThemeControl } from '@/shared/components/ThemeControl';
import { AnimatePresence, motion } from 'framer-motion';
import { MotionPage } from '@/shared/motion/MotionPrimitives';
import PublicScrollMotion from '@/shared/motion/PublicScrollMotion';
import HeaderNumberSearch from './HeaderNumberSearch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';

function Logo() {
  return (
    <Link to="/" className="relative z-10 min-w-0 shrink">
      <BrandLockup />
    </Link>
  );
}

function HeaderIconTooltip({ label, children, side = 'bottom' }: {
  label: string;
  children: React.ReactElement;
  side?: 'top' | 'right' | 'bottom' | 'left';
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} sideOffset={7} collisionPadding={10} className="w-max max-w-44 px-2 py-1 text-center text-[10px] font-bold leading-tight">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

const HEADER_BUTTERFLIES = [
  { left: '5%', top: '62%', wings: ['93', '39'], delay: '-1.2s', duration: '15.5s' },
  { left: '34%', top: '18%', wings: ['78', '87'], delay: '-6.4s', duration: '17s' },
  { left: '64%', top: '68%', wings: ['7', '7'], delay: '-10.1s', duration: '14.8s' },
];

function Header() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { cartCount, wishlistCount, compare, comparePulse, refreshCounts } = useStore();
  const [compareNotice, setCompareNotice] = useState(false);
  useEffect(() => { if (!comparePulse) return; setCompareNotice(true); const timer = setTimeout(() => setCompareNotice(false), 4000); return () => clearTimeout(timer); }, [comparePulse]);
  const { user } = useAppSelector((s) => s.auth);
  const token = localService.getToken();
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
    { label: 'Home', to: '/', icon: House },
    { label: 'How It Works', to: '/how-it-works', icon: BookOpen },
    { label: 'Family Pack', to: '/family-pack', icon: UsersRound },
    { label: 'Numerology', to: '/numerology', icon: Hash },
    { label: 'Contact', to: '/about', icon: PhoneCall },
  ];

  const AccountMenu = (
    token && user ? (
      <div className="group relative">
        <HeaderIconTooltip label="Account menu">
          <button aria-label="Open account menu" className="vnw-interactive grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-foreground shadow-sm"><UserAvatar user={user} className="h-8 w-8" /></button>
        </HeaderIconTooltip>
        <div className="invisible absolute right-0 top-full w-52 pt-3 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
          <div className="glass-panel rounded-xl p-2">
            <div className="px-3 py-2 text-xs text-muted-foreground">Hi, {(user.name || 'User').split(' ')[0]}</div>
            <Link to={dash} className="vnw-interactive flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground"><LayoutDashboard className="h-4 w-4 text-primary" /> Dashboard</Link>
            <Link to="/pre-book#mine" className="vnw-interactive flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground"><CalendarClock className="h-4 w-4 text-primary" /> My Pre-books</Link>
            <Link to="/orders" className="vnw-interactive flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground"><ShoppingCart className="h-4 w-4 text-primary" /> My Orders</Link>
            <Link to="/cart" className="vnw-interactive flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground"><ShoppingCart className="h-4 w-4 text-primary" /> Cart {cartCount ? `(${cartCount})` : ''}</Link>
            <Link to="/wishlist" className="vnw-interactive flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground"><Heart className="h-4 w-4 text-primary" /> Wishlist {wishlistCount ? `(${wishlistCount})` : ''}</Link>
            <Link to="/account" className="vnw-interactive flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground"><User className="h-4 w-4 text-primary" /> Profile</Link>
            <button onClick={() => dispatch(logout())} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"><LogOut className="h-4 w-4" /> Logout</button>
          </div>
        </div>
      </div>
    ) : (
      <>
        <Link to="/login" className="vnw-interactive inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card/85 px-3 py-2 text-xs font-bold text-foreground shadow-sm 2xl:px-4 2xl:text-sm"><User className="h-5 w-5" />Sign In</Link>
        <Link to="/register" className="public-header__register inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-white shadow-[0_10px_22px_-12px_rgba(133,77,14,.62)] transition hover:-translate-y-0.5 2xl:px-4 2xl:text-sm"><Crown className="h-5 w-5 text-amber-200" />Register</Link>
      </>
    )
  );

  const MobileAccount = (
    token && user ? (
      <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-muted p-3">
          <UserAvatar user={user} />
          <div className="min-w-0">
            <div className="truncate text-sm font-black text-foreground">Hi, {(user.name || 'User').split(' ')[0]}</div>
            <div className="truncate text-xs text-muted-foreground">{user.email || user.phone || 'Welcome back'}</div>
          </div>
        </div>
        <div className="grid gap-1">
          <Link to={dash} onClick={() => setOpen(false)} className="vnw-interactive flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-foreground"><LayoutDashboard className="h-4 w-4 text-primary" /> Dashboard</Link>
          <Link to="/pre-book#mine" onClick={() => setOpen(false)} className="vnw-interactive flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-foreground"><CalendarClock className="h-4 w-4 text-primary" /> My Pre-books</Link>
          <Link to="/orders" onClick={() => setOpen(false)} className="vnw-interactive flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-foreground"><ShoppingCart className="h-4 w-4 text-primary" /> My Orders</Link>
          <Link to="/account" onClick={() => setOpen(false)} className="vnw-interactive flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-foreground"><User className="h-4 w-4 text-primary" /> Profile</Link>
          <button onClick={() => { dispatch(logout()); setOpen(false); }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-destructive hover:bg-destructive/10"><LogOut className="h-4 w-4" /> Logout</button>
        </div>
      </div>
    ) : null
  );

  return (
    <TooltipProvider delayDuration={250}>
      <header
        className={`public-header ${isScrolled ? 'is-scrolled' : 'is-top'} fixed inset-x-0 top-0 z-50`}
        data-scrolled={isScrolled}
        data-guest={!token || !user}
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
          <div className="relative z-10 min-w-0"><Logo /></div>
          <nav className="relative z-10 hidden min-w-0 flex-nowrap items-center gap-0 whitespace-nowrap text-[11px] font-bold text-foreground min-[1200px]:flex 2xl:gap-1 2xl:text-sm" aria-label="Primary navigation">
            {nav.map((n) => { const Icon = n.icon; return <Link key={n.label} to={n.to} aria-current={location.pathname === n.to ? 'page' : undefined} className={location.pathname === n.to ? 'inline-flex items-center gap-1 rounded-xl border border-primary/30 bg-primary/10 px-2 py-2.5 text-primary shadow-sm 2xl:px-3' : 'vnw-interactive inline-flex items-center gap-1 rounded-xl border border-transparent px-2 py-2.5 2xl:px-3'}><Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{n.label}</Link>; })}
          </nav>
          <div className="hidden min-[1200px]:contents"><HeaderNumberSearch /></div>
          <div className="relative z-10 ml-auto flex shrink-0 items-center justify-end gap-1 2xl:gap-1.5">
            <div className="flex"><ThemeControl compact /></div>
            {token && user && <div className="public-header__shortcuts hidden items-center gap-1 min-[1200px]:flex">
              {[
                { label: 'Cart', to: '/cart', icon: ShoppingCart, count: cartCount },
                { label: 'Wishlist', to: '/wishlist', icon: Heart, count: wishlistCount },
              ].map(({ label, to, icon: Icon, count }) => <HeaderIconTooltip key={to} label={label}><Link to={to} aria-label={label} className="public-header__shortcut vnw-interactive relative grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-foreground shadow-sm"><Icon className="h-5 w-5" />{count ? <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-black text-primary-foreground">{count}</span> : null}</Link></HeaderIconTooltip>)}
            </div>}
            {(!token || !user) && <div className="hidden items-center gap-2 min-[1200px]:flex">{AccountMenu}</div>}
            <div className="relative">
              <HeaderIconTooltip label="Compare numbers"><Link to="/compare" aria-label="Compare numbers" onClick={() => setCompareNotice(false)} key={comparePulse} className={`public-header__shortcut relative grid h-10 w-10 place-items-center rounded-xl border bg-card shadow-sm ${compareNotice ? 'comparison-cue border-primary text-primary' : 'border-border text-foreground'}`}><GitCompareArrows className="h-5 w-5" />{compare.length > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{compare.length}</span>}</Link></HeaderIconTooltip>
              <AnimatePresence>{compareNotice && <motion.div role="status" className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-primary/30 bg-card p-3 text-xs shadow-lg" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><button onClick={() => setCompareNotice(false)} aria-label="Dismiss comparison notice" className="float-right"><X className="h-3 w-3" /></button><strong>Added to comparison</strong><Link to="/compare" onClick={() => setCompareNotice(false)} className="mt-1 block font-bold text-primary">Compare {compare.length} numbers →</Link></motion.div>}</AnimatePresence>
            </div>
            {token && user && <div className="hidden items-center gap-2 min-[1200px]:flex">{AccountMenu}</div>}
            <HeaderIconTooltip label="Open navigation menu">
              <button onClick={() => setOpen(true)} aria-label="Open navigation menu" className="vnw-interactive grid h-11 w-11 place-items-center rounded-xl border border-border bg-card/85 text-foreground shadow-sm min-[1200px]:hidden"><Menu className="h-5 w-5" /></button>
            </HeaderIconTooltip>
          </div>
        </div>
      </header>

      <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] min-[1200px]:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="absolute inset-0 bg-stone-950/35" onClick={() => setOpen(false)} />
          <motion.div
            className="public-header__drawer glass-panel absolute right-3 top-3 flex max-h-[calc(100vh-1.5rem)] w-[min(360px,calc(100vw-1.5rem))] flex-col overflow-y-auto rounded-xl p-4"
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-3 flex min-w-0 items-center justify-start gap-1">
              {(!token || !user) && <>
                <Link to="/login" onClick={() => setOpen(false)} className="inline-flex min-h-10 min-w-[96px] items-center justify-center whitespace-nowrap rounded-lg border border-border bg-card px-4 py-2 text-xs font-black text-foreground shadow-sm">Sign In</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="inline-flex min-h-10 min-w-[96px] items-center justify-center whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-xs font-black text-primary-foreground">Sign Up</Link>
              </>}
              <div className="ml-auto flex shrink-0 items-center gap-1">
                <HeaderIconTooltip label="Close navigation menu" side="left">
                  <button onClick={() => setOpen(false)} aria-label="Close navigation menu" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-card text-foreground"><X className="h-4 w-4" /></button>
                </HeaderIconTooltip>
              </div>
            </div>
            {MobileAccount && <div className="mb-3">{MobileAccount}</div>}
            {location.pathname !== '/' && <div className="public-header__drawer-search mb-4"><HeaderNumberSearch /></div>}
            <div className="grid gap-2">
              <Link to="/pre-book" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground shadow-sm"><CalendarClock className="h-4 w-4" /> Pre-book VIP Numbers</Link>
              <Link to="/wishlist" onClick={() => setOpen(false)} className="vnw-interactive flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground shadow-sm"><span className="flex items-center gap-2"><Heart className="h-4 w-4 text-primary" /> Wishlist</span>{wishlistCount || ''}</Link>
              <Link to="/cart" onClick={() => setOpen(false)} className="vnw-interactive flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground shadow-sm"><span className="flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-primary" /> Cart</span>{cartCount || ''}</Link>
              <Link to="/compare" onClick={() => setOpen(false)} className="vnw-interactive flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground shadow-sm"><span className="flex items-center gap-2"><GitCompareArrows className="h-4 w-4 text-primary" /> Compare Numbers</span>{compare.length ? <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground">{compare.length}</span> : null}</Link>
              {nav.map((n) => { const Icon = n.icon; return <Link key={n.label} to={n.to} onClick={() => setOpen(false)} className="vnw-interactive flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground shadow-sm"><Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />{n.label}</Link>; })}
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </TooltipProvider>
  );
}

function Footer() {
  const site = useStore((state) => state.site);
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
        <div className="relative z-10 grid gap-6 px-6 py-8 md:grid-cols-2 lg:grid-cols-[1.2fr_repeat(4,1fr)]">
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
              <li><Link to="/premium-numbers">Premium Numbers</Link></li>
              <li><Link to="/family-pack">Family Pack</Link></li>
              <li><Link to="/categories">Number Categories</Link></li>
              <li><Link to="/how-it-works">How It Works</Link></li>
              <li><Link to="/numerology">Numerology</Link></li>
              <li><Link to="/faq">FAQs</Link></li>
              <li><Link to="/about">About &amp; Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-black text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/terms-and-conditions">Terms &amp; Conditions</Link></li>
              <li><Link to="/privacy-policy">Privacy Policy</Link></li>
              <li><Link to="/refund-policy">Refund Policy</Link></li>
              <li><Link to="/delivery-fulfilment-policy">Delivery &amp; Fulfilment</Link></li>
              <li><Link to="/cookie-policy">Cookie Policy</Link></li>
              <li><Link to="/mnp-activation-policy">MNP &amp; Activation</Link></li>
              <li><Link to="/disclaimer">Disclaimer</Link></li>
              <li><Link to="/grievance-redressal">Grievance Redressal</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-black text-foreground">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-primary" /><a href={`tel:${site.CONTACT_PHONE || APP_CONFIG.contactPhone}`}>{site.CONTACT_PHONE || APP_CONFIG.contactPhone}</a></li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 text-primary" /><a className="break-all" href={`mailto:${site.CONTACT_EMAIL || APP_CONFIG.contactEmail}`}>{site.CONTACT_EMAIL || APP_CONFIG.contactEmail}</a></li>
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
          <span className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-primary" /> Follow Us</span>
        </div>
      </div>
    </footer>
  );
}

export function PromoBar() {
  const { site } = useStore();
  const text = site.PROMO_TEXT;
  const [expiresAt] = useState(() => Number(sessionStorage.getItem('vnw_login_promo_expires_at')) || 0);
  const [visible, setVisible] = useState(() => {
    const expiry = Number(sessionStorage.getItem('vnw_login_promo_expires_at')) || 0;
    return Boolean(localService.getToken() && expiry > Date.now() && sessionStorage.getItem('vnw_login_promo_started') !== String(expiry));
  });

  const close = () => {
    setVisible(false);
    sessionStorage.removeItem('vnw_login_promo_expires_at');
  };

  useEffect(() => {
    if (!visible || !text) return;
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) { close(); return; }
    sessionStorage.setItem('vnw_login_promo_started', String(expiresAt));
    const timer = window.setTimeout(close, remaining);
    return () => window.clearTimeout(timer);
  }, [expiresAt, text, visible]);

  if (!visible || !text) return null;
  return (
    <div className="px-3 pt-2">
      <div className="relative mx-auto max-w-7xl rounded-2xl border border-border bg-accent px-8 py-2 text-center text-xs font-black text-accent-foreground shadow-sm sm:text-sm">
        <Link to="/shop?badge=HOT_DEAL">{text}</Link>
        <button onClick={close} aria-label="Close sale announcement"
          className="absolute right-4 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-accent-foreground/70 transition-colors hover:bg-black/10 hover:text-accent-foreground"><X className="h-3.5 w-3.5" /></button>
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
    <div className={`customer-motion-scope app-shell-bg flex min-h-screen flex-col ${location.pathname === '/' ? 'is-home-route' : ''}`}>
      <Header />
      <div className="pt-[72px]">
        {location.pathname === '/' && <div className="public-home-mobile-search min-[1200px]:hidden"><HeaderNumberSearch /></div>}
        {location.pathname === '/' && <PromoBar />}
      </div>
      <main className="flex-1 pb-20 lg:pb-0">
        <MotionPage routeKey={location.pathname}>
          <PublicScrollMotion routeKey={location.pathname}>
            <Outlet />
          </PublicScrollMotion>
        </MotionPage>
      </main>
      <Footer />
      <FloatingActions />
      <BottomNav />
    </div>
  );
}
