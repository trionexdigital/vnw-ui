import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, AtSign, Eye, EyeOff, Loader2, LockKeyhole, KeyRound, Sparkles, ShieldCheck, Headphones, BadgeCheck, Search, UserRound } from 'lucide-react';
import { BrandLockup } from '@/shared/components/Logo';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { login, registerUser } from '@/app/authSlice';
import { useToast } from '@/shared/hooks/use-toast';
import { localService } from '@/core/services/local';
import { roleHome } from '@/core/lib/permissions';
import { useLanguage } from '@/shared/language/LanguageContext';
import { LanguageText } from '@/shared/language/LanguageText';
import './Auth.css';

type Mode = 'login' | 'register' | 'forgot';
const features = [
  { icon: ShieldCheck, title: 'Verified listings', description: 'Explore available VIP numbers.' },
  { icon: Headphones, title: 'Guided support', description: 'Help from selection to activation.' },
  { icon: BadgeCheck, title: 'Clear pricing', description: 'Review the price before you buy.' },
  { icon: Search, title: 'Memorable patterns', description: 'Find a number that feels like you.' },
];

export function validAuthIdentifier(value: string) {
  const input = value.trim();
  if (input.includes('@')) return input.length <= 128 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
  const number = input.replace(/[\s().-]/g, '').replace(/^\+?91(?=\d{10}$)/, '');
  return /^[6-9]\d{9}$/.test(number);
}

export default function Auth({ mode }: { mode: Mode }) {
  const dispatch = useAppDispatch(), navigate = useNavigate(), location = useLocation();
  const { toast } = useToast(), { t } = useLanguage();
  const [params] = useSearchParams();
  const from = (location.state as any)?.from;
  const returnPath = typeof from?.pathname === 'string' && from.pathname.startsWith('/') && !from.pathname.startsWith('//') && !['/login', '/register', '/forgot'].includes(from.pathname)
    ? from.pathname + (from.search || '') + (from.hash || '') : null;
  const paymentReturn = params.get('return_to');
  const loginDestination = returnPath || (paymentReturn && /^\/payments\/return(?:\?|$)/.test(paymentReturn) ? paymentReturn : null);
  const { isLoading, user } = useAppSelector(s => s.auth);
  const [form, setForm] = useState({ identifier: '', full_name: '', password: '', confirm_password: '' });
  const [showPw, setShowPw] = useState(false), [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const reset = mode === 'forgot', signup = mode === 'register';
  const title = signup ? 'Create Account' : reset ? 'Reset Password' : 'Sign In';

  useEffect(() => { if (localService.getToken()) navigate(loginDestination || roleHome(user?.role)); }, []);
  useEffect(() => { setError(''); setShowPw(false); setShowConfirm(false); }, [mode]);
  const set = (key: keyof typeof form, value: string) => { setError(''); setForm(old => ({ ...old, [key]: value })); };
  const authLink = (path: string) => path + (params.size ? `?${params.toString()}` : '');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (reset || isLoading || submitting.current) return;
    if (!validAuthIdentifier(form.identifier)) { setError('Enter a valid mobile number or email address.'); return; }
    if (signup && form.password !== form.confirm_password) { setError('Passwords do not match'); return; }
    submitting.current = true;
    setError('');
    try {
      if (signup) {
        const account: any = await dispatch(registerUser({ full_name: form.full_name.trim(), identifier: form.identifier.trim(), password: form.password, confirm_password: form.confirm_password, ref_code: params.get('ref') || undefined })).unwrap();
        toast({ title: t('Account created') });
        navigate(loginDestination || roleHome(account?.role));
      } else {
        const account: any = await dispatch(login({ identifier: form.identifier.trim(), password: form.password })).unwrap();
        sessionStorage.setItem('vnw_login_promo_expires_at', String(Date.now() + 5_000));
        sessionStorage.removeItem('vnw_login_promo_started'); sessionStorage.removeItem('vnw_promo_hidden');
        toast({ title: t('Welcome back!') });
        navigate(loginDestination || ((account?.role || 'USER').toUpperCase() === 'USER' ? '/' : roleHome(account?.role)));
      }
    } catch (failure: any) {
      const message = typeof failure === 'string' ? failure : failure.message;
      setError(message || (signup ? 'Registration failed' : 'Login failed'));
    } finally { submitting.current = false; }
  };

  return (
    <main className={`auth-screen ${reset ? 'auth-screen--reset' : signup ? 'auth-screen--register' : ''}`}>
      <div className="auth-layout">
        <header className="auth-brand-row">
          <Link to="/" className="auth-brand" aria-label="VIP Number World home"><BrandLockup logoClassName="auth-brand__logo" sloganClassName="auth-brand__slogan" /></Link>
        </header>
        <section className="auth-story" aria-label="VIP number benefits">
          <div className="auth-eyebrow"><Sparkles aria-hidden="true" /><span>Premium numbers, personal identity</span></div>
          <h2 className="auth-story__headline">Your number.<span>Your identity.</span></h2>
          <p className="auth-story__description">Discover a memorable VIP number with clear pricing and guidance from selection to activation.</p>
          <div className="auth-features">{features.map(({ icon: Icon, title: featureTitle, description }) => <div className="auth-feature" key={featureTitle}><span className="auth-feature__icon"><Icon aria-hidden="true" /></span><div><h3>{featureTitle}</h3><p>{description}</p></div></div>)}</div>
          <div className="auth-story__trust"><span><ShieldCheck aria-hidden="true" />Verified listings</span><span><Headphones aria-hidden="true" />Guided support</span></div>
        </section>
        <section className="auth-form-pane" aria-labelledby="auth-title">
          <form onSubmit={submit} className="auth-form" data-testid="auth-form">
            <div className="auth-form__heading"><h1 id="auth-title">{title}</h1><Link to="/" className="auth-back"><ArrowLeft aria-hidden="true" /><span>Back to store</span></Link></div>
            <p className="auth-form__intro">{reset ? 'Password reset is coming soon. Please sign in if you remember your password.' : signup ? 'Join VIP Number World' : 'Access your account, saved wishlist and orders.'}</p>
            {reset && <div className="auth-coming-soon" role="status"><KeyRound aria-hidden="true" /><span>Coming soon</span></div>}
            <fieldset disabled={reset || isLoading} className="auth-fields">
              {signup && <label className="auth-field"><span>Full name</span><div className="auth-input"><UserRound aria-hidden="true" /><input name="full_name" autoComplete="name" required maxLength={96} placeholder="Full name" value={form.full_name} onChange={e => set('full_name', e.target.value)} /></div></label>}
              <label className="auth-field"><span>Mobile number or email</span><div className="auth-input"><AtSign aria-hidden="true" /><input name="identifier" type="text" inputMode="email" autoComplete="username" required maxLength={128} placeholder="Mobile number or email" value={form.identifier} onChange={e => set('identifier', e.target.value)} /></div></label>
              {!reset && <>
                <div className="auth-field"><div className="auth-field__label"><label htmlFor="auth-password">Password</label>{!signup && <Link to={authLink('/forgot')} state={location.state}>Forgot password?</Link>}</div><div className="auth-input"><LockKeyhole aria-hidden="true" /><input id="auth-password" name="password" required minLength={signup ? 6 : undefined} autoComplete={signup ? 'new-password' : 'current-password'} type={showPw ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={e => set('password', e.target.value)} /><button type="button" aria-label={showPw ? 'Hide password' : 'Show password'} onClick={() => setShowPw(old => !old)}>{showPw ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button></div>{signup && <small>Use at least 6 characters.</small>}</div>
                {signup && <label className="auth-field"><span>Confirm password</span><div className="auth-input"><KeyRound aria-hidden="true" /><input name="confirm_password" required minLength={6} type={showConfirm ? 'text' : 'password'} autoComplete="new-password" placeholder="Confirm password" value={form.confirm_password} onChange={e => set('confirm_password', e.target.value)} /><button type="button" aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'} onClick={() => setShowConfirm(old => !old)}>{showConfirm ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button></div></label>}
              </>}
              {reset && <label className="auth-field"><span>Reason for reset (optional)</span><textarea placeholder="Reason for reset (optional)" rows={3} readOnly /></label>}
            </fieldset>
            {error && <p className="auth-error" role="alert">{t(error)}</p>}
            <button type="submit" disabled={reset || isLoading} className="auth-submit">{isLoading ? <Loader2 aria-hidden="true" className="animate-spin" /> : <><span>{reset ? 'Coming soon' : title}</span><ArrowRight aria-hidden="true" /></>}</button>
            {signup && <p className="auth-terms"><span>By creating an account, you agree to the following policies.</span><br /><Link to="/terms-and-conditions">Terms</Link> · <Link to="/privacy-policy">Privacy Policy</Link></p>}
            <div className="auth-form__switch">{signup ? <><span>Already have an account?</span><Link to={authLink('/login')} state={location.state}>Sign in</Link></> : reset ? <><span>Remembered it?</span><Link to={authLink('/login')} state={location.state}>Sign in</Link></> : <><span>No account?</span><Link to={authLink('/register')} state={location.state}>Create one</Link></>}</div>
            <div className="auth-form__trust"><ShieldCheck aria-hidden="true" /><span>Verified listings · Guided support</span></div>
          </form>
        </section>
        <footer className="auth-footer"><span><LanguageText source="© {year} VIP Number World. All rights reserved." values={{ year: new Date().getFullYear() }} /></span><nav aria-label="Legal"><Link to="/privacy-policy">Privacy Policy</Link><Link to="/terms-and-conditions">Terms</Link></nav></footer>
      </div>
    </main>
  );
}
