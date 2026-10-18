import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Loader2, Crown, Sparkles, ShieldCheck, Headphones } from 'lucide-react';
import { BrandLockup } from '@/shared/components/Logo';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { login, registerUser } from '@/app/authSlice';
import { forgotPassword } from '@/core/api/authAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { localService } from '@/core/services/local';
import { roleHome } from '@/core/lib/permissions';
import { APP_CONFIG } from '@/core/config/app.config';
import './Auth.css';

type Mode = 'login' | 'register' | 'forgot';
const homeFor = (role?: string) => roleHome(role);

export default function Auth({ mode }: { mode: Mode }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from;
  const returnPath = typeof from?.pathname === 'string' && from.pathname.startsWith('/') && !from.pathname.startsWith('//') && !['/login', '/register', '/forgot'].includes(from.pathname)
    ? from.pathname + (from.search || '') + (from.hash || '') : null;
  const { toast } = useToast();
  const [params] = useSearchParams();
  const paymentReturn = params.get('return_to');
  const loginDestination = returnPath || (paymentReturn && /^\/payments\/return(?:\?|$)/.test(paymentReturn) ? paymentReturn : null);
  const { isLoading, user } = useAppSelector((s) => s.auth);
  const [showPw, setShowPw] = useState(false);

  const [form, setForm] = useState({
    email: '', password: '', full_name: '', phone: '', confirm_password: '',
    ref_code: params.get('ref') || '', reason: '',
    role: 'USER',
  });

  useEffect(() => { if (localService.getToken()) navigate(loginDestination || roleHome(user?.role)); }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const input = 'input-luxury w-full';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'login') {
        const u: any = await dispatch(login({ email: form.email, password: form.password })).unwrap();
        const promoSession = String(Date.now() + 5_000);
        sessionStorage.setItem('vnw_login_promo_expires_at', promoSession);
        sessionStorage.removeItem('vnw_login_promo_started');
        sessionStorage.removeItem('vnw_promo_hidden');
        toast({ title: 'Welcome back!' });
        navigate(loginDestination || ((u?.role || 'USER').toUpperCase() === 'USER' ? '/' : homeFor(u?.role)));
      } else if (mode === 'register') {
        if (form.password !== form.confirm_password) { toast({ title: 'Passwords do not match', variant: 'destructive' }); return; }
        const u: any = await dispatch(registerUser({
          full_name: form.full_name, phone: form.phone, email: form.email,
          password: form.password, confirm_password: form.confirm_password,
          ref_code: form.ref_code || undefined, role: form.role,
        })).unwrap();
        toast({ title: 'Account created' });
        navigate(loginDestination || homeFor(u?.role));
      } else {
        const msg = await forgotPassword({ email: form.email, reason: form.reason || 'Password reset request' });
        toast({ title: 'Request submitted', description: msg });
        navigate('/login');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: typeof err === 'string' ? err : err.message, variant: 'destructive' });
    }
  };

  const title = mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Reset Password';

  return (
    <div className="auth-screen app-shell-bg relative grid h-[100dvh] overflow-hidden bg-background p-2 text-foreground lg:grid-cols-2 lg:gap-3 lg:p-3">
      <Link to="/" className="auth-mobile-back absolute left-3 top-3 z-20 inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground shadow-sm lg:hidden"><ArrowLeft className="h-4 w-4" /> Back to store</Link>
      <div className="auth-side vip-auth-panel glass-panel relative hidden min-h-0 flex-col justify-between overflow-hidden rounded-[1.75rem] p-7 lg:flex xl:p-10">
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center rounded-xl bg-card p-2"><BrandLockup logoClassName="h-11 w-11" sloganClassName="h-9 w-52" /></Link>
          <Link to="/" className="mt-4 flex w-fit items-center gap-2 rounded-lg border border-primary/30 bg-card/80 px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary/10"><ArrowLeft className="h-4 w-4" /> Back to store</Link>
        </div>
        <div className="relative z-10 max-w-lg py-4">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/80 px-3 py-1.5 text-xs font-black text-primary"><Sparkles className="h-4 w-4" /> Premium numbers, personal identity</div>
          <h2 className="text-4xl font-black leading-[1.08] tracking-tight text-foreground xl:text-5xl">Your number.<br /><span className="text-gradient-vnw">Your identity.</span></h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground xl:text-base">Discover a memorable VIP number with clear pricing and guidance from selection to activation.</p>
          <div className="auth-side__number mt-6 max-w-sm rounded-2xl border border-primary/25 bg-card/90 p-4 shadow-sm"><span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[.16em] text-primary"><Crown className="h-3.5 w-3.5" /> Make it yours</span><strong className="mt-1 block text-3xl font-black tracking-wide text-foreground xl:text-4xl">9155 915 915</strong></div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-muted-foreground"><span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Verified listings</span><span className="flex items-center gap-1.5"><Headphones className="h-4 w-4 text-primary" /> Guided support</span></div>
        </div>
        <p className="relative z-10 text-xs text-muted-foreground">© {new Date().getFullYear()} {APP_CONFIG.name}</p>
      </div>

      <div className="auth-form-pane flex min-h-0 items-center justify-center overflow-y-auto p-2 pt-12 sm:p-5 sm:pt-14 lg:p-6">
        <form onSubmit={submit} className="auth-form vip-auth-panel glass-panel my-auto w-full max-w-md rounded-[1.75rem] p-5 sm:p-7">
          <Link to="/" className="mx-auto mb-4 flex w-fit items-center justify-center rounded-xl bg-card p-2 lg:hidden">
            <BrandLockup logoClassName="h-10 w-10" sloganClassName="h-8 w-44" />
          </Link>
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">{title}</h1>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            {mode === 'login' ? 'Sign in to your account' : mode === 'register' ? 'Join VIP Number World' : 'We will review your request'}
          </p>

          <div className="space-y-3">
            {mode === 'register' && (
              <>
                <input required placeholder="Full name" className={input} value={form.full_name} onChange={(e) => set('full_name', e.target.value)} />
                <input required placeholder="Phone number" className={input} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              </>
            )}
            <input required type="email" placeholder="Email address" className={input} value={form.email} onChange={(e) => set('email', e.target.value)} />
            {mode !== 'forgot' && (
              <div className="relative">
                <input required type={showPw ? 'text' : 'password'} placeholder="Password" className={input} value={form.password} onChange={(e) => set('password', e.target.value)} />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            )}
            {mode === 'register' && (
              <>
                <input required type="password" placeholder="Confirm password" className={input} value={form.confirm_password} onChange={(e) => set('confirm_password', e.target.value)} />
                <input placeholder="Referral code (optional)" className={input} value={form.ref_code} onChange={(e) => set('ref_code', e.target.value)} />
              </>
            )}
            {mode === 'forgot' && <textarea placeholder="Reason for reset" rows={3} className={input} value={form.reason} onChange={(e) => set('reason', e.target.value)} />}
          </div>

          <button disabled={isLoading} className="btn-royal mt-5 w-full">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : title}
          </button>
          {mode === 'register' && <p className="mt-3 text-center text-xs text-muted-foreground">By creating an account, you agree to our <Link to="/terms-and-conditions" className="text-primary">Terms</Link> and acknowledge our <Link to="/privacy-policy" className="text-primary">Privacy Policy</Link>.</p>}

          <div className="mt-5 text-center text-sm text-muted-foreground">
            {mode === 'login' && (<>
              <Link to="/forgot" className="text-accent hover:underline">Forgot password?</Link>
              <div className="mt-2">No account? <Link to="/register" className="text-accent hover:underline">Create one</Link></div>
            </>)}
            {mode === 'register' && (<>Already have an account? <Link to="/login" className="text-accent hover:underline">Sign in</Link></>)}
            {mode === 'forgot' && (<>Remembered it? <Link to="/login" className="text-accent hover:underline">Sign in</Link></>)}
          </div>
        </form>
      </div>
    </div>
  );
}
