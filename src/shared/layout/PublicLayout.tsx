import { Link, Outlet, useLocation } from 'react-router-dom';
import { Suspense, useEffect, useState } from 'react';
import { Phone, ChevronUp, Facebook, Instagram, Youtube, Mail, Globe, MapPin, MessageCircle, X, Sparkles } from 'lucide-react';
import { useStore } from '@/shared/store/useStore';
import { localService } from '@/core/services/local';
import { APP_CONFIG } from '@/core/config/app.config';
import BottomNav from './BottomNav';
import NewsletterForm from '@/shared/components/NewsletterForm';
import { BrandLockup } from '@/shared/components/Logo';
import { Loader } from '@/shared/components/ui-bits';
import { MotionPage } from '@/shared/motion/MotionPrimitives';
import PublicScrollMotion from '@/shared/motion/PublicScrollMotion';
import HeaderNumberSearch from './HeaderNumberSearch';

import StoreHeader from './StoreHeader';
import FirstVisitTour from '@/shared/components/FirstVisitTour';

function Logo() {
  return (
    <Link to="/" className="relative z-10 min-w-0 shrink">
      <BrandLockup />
    </Link>
  );
}

const HEADER_BUTTERFLIES = [
  { left: '5%', top: '62%', wings: ['93', '39'], delay: '-1.2s', duration: '15.5s' },
  { left: '34%', top: '18%', wings: ['78', '87'], delay: '-6.4s', duration: '17s' },
  { left: '64%', top: '68%', wings: ['7', '7'], delay: '-10.1s', duration: '14.8s' },
];

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
              <li><Link to="/corporate-numbers">Corporate Numbers</Link></li>
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
        <div className="store-footer__bottom relative z-10 flex flex-col items-center gap-2 border-t border-border px-4 py-4 text-xs text-muted-foreground">
          <span className="store-footer__copyright">&copy; {new Date().getFullYear()} VNW - VIP Number World. All rights reserved.</span>
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
    <div className={`storefront-shell customer-motion-scope app-shell-bg flex min-h-screen flex-col ${location.pathname === '/' ? 'is-home-route' : ''}`}>
      <StoreHeader />
      <div className="store-header-offset">
        {location.pathname === '/' && <div className="public-home-mobile-search min-[1200px]:hidden"><HeaderNumberSearch /></div>}
        {location.pathname === '/' && <PromoBar />}
      </div>
      <main className="flex-1">
        <MotionPage routeKey={location.pathname}>
          <PublicScrollMotion routeKey={location.pathname}>
            <div className="public-route-content"><Suspense fallback={<div className="py-4"><Loader label="Loading screen" /></div>}><Outlet /></Suspense></div>
          </PublicScrollMotion>
        </MotionPage>
      </main>
      <Footer />
      <FloatingActions />
      <BottomNav />
      <FirstVisitTour />
    </div>
  );
}
