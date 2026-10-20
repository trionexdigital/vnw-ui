import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Heart, Search, ShieldCheck, Sparkles, Zap, CalendarClock } from 'lucide-react';
import Modal from './Modal';
import { useLanguage } from '@/shared/language/LanguageContext';
import { LanguageText } from '@/shared/language/LanguageText';
import { useLocationPreference } from '@/shared/location/LocationProvider';
import './FirstVisitTour.css';

export const TOUR_SEEN_KEY = 'vnw_website_tour_seen_v1';
let dismissedThisSession = false;
const seen = () => { try { return dismissedThisSession || localStorage.getItem(TOUR_SEEN_KEY) === '1'; } catch { return dismissedThisSession; } };
const getSteps = (t: (source: string) => string) => [
  { title: t('Start with a search'), description: t('Search for digits, a budget or a pattern. Use AI Search when you have an idea in mind.'), icon: Search },
  { title: t('Find a pattern you love'), description: t('Browse categories, compare prices and save your favourites. Open a number card for its details.'), icon: Heart },
  { title: t('Choose how to get your number'), description: t('RTA is ready to activate, RTP is ready to port, and NON-RTP is available for pre-booking. Set your PIN code for local RTA numbers.'), icon: ShieldCheck },
];

export default function FirstVisitTour() {
  const { t, chooserOpen } = useLanguage();
  const location = useLocationPreference();
  const { pathname } = useLocation();
  const purchaseRoute = /\/checkout(?:\/|$)|^\/cart(?:\/|$)|^\/payments?(?:\/|$)/.test(pathname);
  const steps = getSteps(t);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (seen() || purchaseRoute || chooserOpen || location.chooserOpen || !location.promptResolved) return;
    const timer = window.setTimeout(() => { if (!seen()) setOpen(true); }, 450);
    return () => window.clearTimeout(timer);
  }, [chooserOpen, location.chooserOpen, location.promptResolved, purchaseRoute]);
  const dismiss = () => {
    dismissedThisSession = true;
    try { localStorage.setItem(TOUR_SEEN_KEY, '1'); } catch { /* Keep the session preference when storage is blocked. */ }
    setOpen(false);
  };
  const current = steps[step]; const Icon = current.icon;
  return <Modal open={open && !purchaseRoute && !chooserOpen && !location.chooserOpen} onClose={dismiss} title={t('Your VIP number journey')} className="first-visit-tour">
    <div className="first-visit-tour__body" data-tour-step={step}>
      <div className="first-visit-tour__art" aria-hidden="true">
        <span className="first-visit-tour__orb first-visit-tour__orb--one" /><span className="first-visit-tour__orb first-visit-tour__orb--two" />
        {step === 0 ? <div className="first-visit-tour__search-demo"><Sparkles /><div><Search /><span data-no-translate>786</span><span className="first-visit-tour__search-spark"><ArrowRight /></span></div><div className="first-visit-tour__digits" data-no-translate>987 <strong>786</strong> 0786</div></div>
          : step === 1 ? <div className="first-visit-tour__card-demo"><Heart /><span data-no-translate>800 <strong>800</strong> 8008</span><div><span /><span /><span /></div></div>
            : <div className="first-visit-tour__readiness-demo">{[[Zap, 'RTA'], [ShieldCheck, 'RTP'], [CalendarClock, 'NON-RTP']].map(([Symbol, code]) => { const ReadinessIcon = Symbol as typeof Zap; return <div key={String(code)}><ReadinessIcon /><strong data-no-translate>{String(code)}</strong><Check /></div>; })}</div>}
      </div>
      <div className="first-visit-tour__progress"><span><LanguageText source="Step {current} of {total}" values={{ current: step + 1, total: steps.length }} /></span><div>{steps.map((_, index) => <span key={index} data-active={index <= step} />)}</div></div>
      <div className="first-visit-tour__copy" aria-live="polite" aria-atomic="true"><span className="first-visit-tour__icon"><Icon /></span><h2>{current.title}</h2><p>{current.description}</p></div>
      <div className="first-visit-tour__actions">
        {step > 0 ? <button type="button" className="btn-gold-outline" data-tour-back onClick={() => setStep(step - 1)}><ArrowLeft />Back</button> : <button type="button" className="first-visit-tour__skip" data-tour-skip onClick={dismiss}>Skip</button>}
        <button type="button" className="btn-gold" data-tour-next onClick={() => { if (step < steps.length - 1) setStep(step + 1); else { dismiss(); navigate('/shop?focus=search'); } }}>{step < steps.length - 1 ? t('Next') : t('Browse numbers')}<ArrowRight /></button>
      </div>
    </div>
  </Modal>;
}
