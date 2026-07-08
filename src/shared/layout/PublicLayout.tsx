import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Search, Heart, ShoppingCart, User, LogOut, LayoutDashboard, Phone, MessageCircle,
  ChevronDown, ChevronUp, Facebook, Instagram, Youtube, Mail, Globe, MapPin, Bell, Menu, X, Sparkles,
} from 'lucide-react';
import { useStore } from '@/shared/store/useStore';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { logout } from '@/app/authSlice';
import { localService } from '@/core/services/local';
import { APP_CONFIG } from '@/core/config/app.config';
import BottomNav from './BottomNav';
import NewsletterForm from '@/shared/components/NewsletterForm';
import { Logo as BrandLogo } from '@/shared/components/Logo';

function Logo() {
  return (
    <Link to="/" className="flex min-w-0 shrink items-center gap-2">
      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#130f20] ring-1 ring-[#f0d679]/45 sm:h-11 sm:w-11">
        <BrandLogo className="h-9 w-9 object-contain sm:h-10 sm:w-10" />
      </span>
      <span className="hidden min-w-0 leading-tight sm:block">
        <span className="block truncate text-lg font-black text-gold">VNW</span>
        <span className="block text-[9px] font-bold uppercase text-[#1d1830]/68">VIP Number World</span>
      </span>
    </Link>
  );
}

function CountBadge({ n }: { n: number }) {
  if (!n) return null;
  return <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-gradient-to-br from-[#ff8a21] to-[#d923c6] px-1 text-[9px] font-bold text-white">{n}</span>;
}

const NUMBER_CATS = [
  { label: 'All VIP Numbers', to: '/shop' },
  { label: 'Premium Numbers', to: '/shop?category=premium' },
  { label: 'Numerology', to: '/numerology' },
  { label: 'Family Packs', to: '/shop?category=family' },
];

function Header() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { cartCount, wishlistCount, refreshCounts } = useStore();
  const { user } = useAppSelector((s) => s.auth);
  const token = localService.getToken();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => { if (token) refreshCounts(); }, [token]);
  const dash = user?.role === 'ADMIN' ? '/admin' : user?.role === 'DEALER' ? '/dealer' : '/dashboard';
  const nav = [
    { label: 'Home', to: '/' },
    { label: 'How It Works', to: '/about' },
    { label: 'About Us', to: '/about' },
    { label: 'Testimonials', to: '/#testimonials' },
    { label: 'Contact Us', to: '/contact' },
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
        <button className="grid h-11 w-11 place-items-center rounded-2xl border border-white/70 bg-white/60 text-[#1d1830] shadow-sm transition hover:-translate-y-0.5"><User className="h-5 w-5" /></button>
        <div className="invisible absolute right-0 top-full w-52 pt-3 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
          <div className="glass-panel rounded-2xl p-2">
            <div className="px-3 py-2 text-xs text-muted-foreground">Hi, {(user.name || 'User').split(' ')[0]}</div>
            <Link to={dash} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground hover:bg-white/70"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
            <Link to="/orders" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground hover:bg-white/70"><ShoppingCart className="h-4 w-4" /> My Orders</Link>
            <Link to="/account" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground hover:bg-white/70"><User className="h-4 w-4" /> Profile</Link>
            <button onClick={() => dispatch(logout())} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-500 hover:bg-white/70"><LogOut className="h-4 w-4" /> Logout</button>
          </div>
        </div>
      </div>
    ) : (
      <>
        <Link to="/login" className="inline-flex rounded-2xl border border-white/70 bg-white/64 px-3.5 py-2 text-xs font-bold text-[#5b27ee] shadow-sm transition hover:-translate-y-0.5 xl:text-sm">Sign In</Link>
        <Link to="/register" className="btn-royal !min-h-0 px-3.5 py-2 text-xs xl:text-sm">Register</Link>
      </>
    )
  );

  const MobileAccount = (
    token && user ? (
      <div className="rounded-2xl border border-white/75 bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center gap-3 rounded-2xl bg-[#faf7ff] p-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl royal-gradient-bg text-sm font-black text-white">
            {(user.name || 'U').slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-black text-[#1d1830]">Hi, {(user.name || 'User').split(' ')[0]}</div>
            <div className="truncate text-xs text-muted-foreground">{user.email || user.phone || 'Welcome back'}</div>
          </div>
        </div>
        <div className="grid gap-1">
          <Link to={dash} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-bold text-[#1d1830]/80 hover:bg-[#faf7ff]"><LayoutDashboard className="h-4 w-4 text-[#7c2cff]" /> Dashboard</Link>
          <Link to="/orders" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-bold text-[#1d1830]/80 hover:bg-[#faf7ff]"><ShoppingCart className="h-4 w-4 text-[#7c2cff]" /> My Orders</Link>
          <Link to="/account" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-bold text-[#1d1830]/80 hover:bg-[#faf7ff]"><User className="h-4 w-4 text-[#7c2cff]" /> Profile</Link>
          <button onClick={() => { dispatch(logout()); setOpen(false); }} className="flex items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm font-bold text-rose-500 hover:bg-rose-50"><LogOut className="h-4 w-4" /> Logout</button>
        </div>
      </div>
    ) : (
      <div className="grid grid-cols-2 gap-2">
        <Link to="/login" onClick={() => setOpen(false)} className="rounded-2xl border border-white/75 bg-white px-4 py-3 text-center text-sm font-black text-[#5b27ee] shadow-sm">Sign In</Link>
        <Link to="/register" onClick={() => setOpen(false)} className="btn-royal !min-h-0 px-4 py-3 text-sm">Register</Link>
      </div>
    )
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/70 bg-white/90 px-0 py-0 shadow-[0_18px_54px_-38px_rgba(93,44,159,.7)] backdrop-blur-2xl">
        <div className="glass-nav flex min-h-[62px] w-full items-center gap-2 rounded-none px-3 py-1.5 sm:px-4">
          <Logo />
          <nav className="ml-2 hidden min-w-0 flex-nowrap items-center gap-0.5 whitespace-nowrap rounded-full border border-white/70 bg-white/42 p-1 text-xs font-bold text-[#1d1830]/82 lg:flex xl:ml-5 xl:text-sm">
            <Link to="/" className="rounded-full bg-white px-3 py-2 text-[#6f28e8] shadow-sm xl:px-4">Home</Link>
            <div className="group relative">
              <button className="flex items-center gap-1 rounded-full px-3 py-2 transition hover:bg-white/70 hover:text-[#7c2cff] xl:px-4">Explore <ChevronDown className="h-4 w-4" /></button>
              <div className="invisible absolute left-0 top-full z-50 w-56 pt-4 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                <div className="glass-panel rounded-2xl p-2">
                  {NUMBER_CATS.map((c) => <Link key={c.label} to={c.to} className="block rounded-xl px-3 py-2 text-sm hover:bg-white/70">{c.label}</Link>)}
                </div>
              </div>
            </div>
            {nav.slice(1).map((n) => <Link key={n.label} to={n.to} className="rounded-full px-3 py-2 transition hover:bg-white/70 hover:text-[#7c2cff] xl:px-4">{n.label}</Link>)}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <Link to="/shop" className="hidden h-10 items-center gap-1.5 rounded-2xl border border-white/70 bg-white/62 px-3 text-xs font-black text-[#1d1830] shadow-sm transition hover:-translate-y-0.5 xl:inline-flex"><Search className="h-4 w-4 text-[#7c2cff]" /> Search</Link>
            <Link to="/wishlist" aria-label="Wishlist" className="relative hidden h-10 w-10 place-items-center rounded-2xl border border-white/70 bg-white/58 text-[#1d1830] shadow-sm transition hover:-translate-y-0.5 md:grid"><Heart className="h-5 w-5" /><CountBadge n={wishlistCount} /></Link>
            <Link to="/cart" aria-label="Cart" className="relative grid h-10 w-10 place-items-center rounded-2xl border border-white/70 bg-white/58 text-[#1d1830] shadow-sm transition hover:-translate-y-0.5"><ShoppingCart className="h-5 w-5" /><CountBadge n={cartCount} /></Link>
            <button aria-label="Notifications" className="relative hidden h-10 w-10 place-items-center rounded-2xl border border-white/70 bg-white/58 text-[#1d1830] shadow-sm md:grid"><Bell className="h-5 w-5" /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#ff8a21]" /></button>
            <div className="hidden items-center gap-2 sm:flex">{AccountMenu}</div>
            <button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-2xl border border-white/70 bg-white/60 text-[#1d1830] lg:hidden"><Menu className="h-5 w-5" /></button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-[#1d1830]/35 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="glass-panel absolute right-3 top-3 flex max-h-[calc(100vh-1.5rem)] w-[min(360px,calc(100vw-1.5rem))] flex-col rounded-[1.5rem] p-4 animate-rise-in">
            <div className="mb-4 flex items-center justify-between">
              <Logo />
              <button onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-2xl bg-white/70"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={submit} className="mb-4 flex items-center gap-2 rounded-2xl border border-white/70 bg-white/72 px-3 py-2">
              <Search className="h-4 w-4 text-[#7c2cff]" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dream number..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            </form>
            <div className="grid gap-2">
              {[{ label: 'Home', to: '/' }, { label: 'Explore Numbers', to: '/shop' }, { label: 'Numerology', to: '/numerology' }, { label: 'How It Works', to: '/about' }, { label: 'About Us', to: '/about' }, { label: 'Contact Us', to: '/contact' }].map((n) => (
                <Link key={n.label} to={n.to} onClick={() => setOpen(false)} className="rounded-2xl border border-white/70 bg-white/55 px-4 py-3 text-sm font-bold text-[#1d1830] shadow-sm">{n.label}</Link>
              ))}
            </div>
            <div className="mt-4 sm:hidden">{MobileAccount}</div>
          </div>
        </div>
      )}
    </>
  );
}

function Footer() {
  return (
    <footer className="px-3 pb-3">
      <div className="glass-panel mx-auto max-w-7xl overflow-hidden rounded-[1.5rem]">
        <div className="grid gap-6 px-6 py-8 md:grid-cols-[1.1fr_1fr] lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">India's trusted VIP number marketplace with genuine numbers, secure payments, and pan-India delivery.</p>
            <div className="mt-4 flex gap-2">
              {[Facebook, Instagram, MessageCircle, Youtube].map((I, i) => <span key={i} className="grid h-10 w-10 place-items-center rounded-2xl bg-white/62 text-[#7c2cff] shadow-sm"><I className="h-4 w-4" /></span>)}
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-black text-[#1d1830]">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/shop">VIP Numbers</Link></li>
              <li><Link to="/numerology">Numerology</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-black text-[#1d1830]">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#7c2cff]" /> {APP_CONFIG.contactPhone}</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#7c2cff]" /> {APP_CONFIG.contactEmail}</li>
              <li className="flex items-center gap-2"><Globe className="h-4 w-4 text-[#7c2cff]" /> vipnumberworld.com</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#7c2cff]" /> Pan India Delivery</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-black text-[#1d1830]">Exclusive Drops</h4>
            <p className="mb-3 text-sm text-muted-foreground">Get premium number alerts and limited deals.</p>
            <NewsletterForm />
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/60 px-6 py-4 text-xs text-muted-foreground sm:flex-row">
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
      <div className="relative mx-auto max-w-7xl rounded-2xl bg-gradient-to-r from-[#fff2bd] via-[#ffe7fb] to-[#e7dcff] px-8 py-2 text-center text-xs font-black text-[#1d1830] shadow-sm sm:text-sm">
        <Link to="/shop?badge=HOT_DEAL">{text}</Link>
        <button onClick={() => { setHidden(true); sessionStorage.setItem('vnw_promo_hidden', '1'); }}
          className="absolute right-5 text-[#1d1830]/70 hover:text-[#1d1830]">x</button>
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
          className="grid h-11 w-11 place-items-center rounded-2xl border border-white/70 bg-white/80 text-[#7c2cff] shadow-lg backdrop-blur">
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
  useEffect(() => { if (!siteLoaded) loadSite(); }, []);
  return (
    <div className="app-shell-bg flex min-h-screen flex-col">
      <Header />
      <div className="pt-[62px]">
        <PromoBar />
      </div>
      <main className="flex-1 pb-20 lg:pb-0">
        <Outlet />
      </main>
      <Footer />
      <FloatingActions />
      <BottomNav />
    </div>
  );
}
