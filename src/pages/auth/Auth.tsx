import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Crown, Sparkles } from 'lucide-react';
import { BrandLockup } from '@/shared/components/Logo';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { login, registerUser } from '@/app/authSlice';
import { forgotPassword } from '@/core/api/authAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { localService } from '@/core/services/local';
import { roleHome } from '@/core/lib/permissions';
import { APP_CONFIG } from '@/core/config/app.config';
import { ThemeControl } from '@/shared/components/ThemeControl';

type Mode = 'login' | 'register' | 'forgot';
const homeFor = (role?: string) => roleHome(role);

export default function Auth({ mode }: { mode: Mode }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const { isLoading, user } = useAppSelector((s) => s.auth);
  const [showPw, setShowPw] = useState(false);

  const [form, setForm] = useState({
    email: '', password: '', full_name: '', phone: '', confirm_password: '',
    ref_code: params.get('ref') || '', reason: '',
    role: params.get('role') === 'DEALER' ? 'DEALER' : 'USER',
  });

  useEffect(() => { if (localService.getToken()) navigate(roleHome(user?.role)); }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const input = 'input-luxury w-full';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'login') {
        const u: any = await dispatch(login({ email: form.email, password: form.password })).unwrap();
        toast({ title: 'Welcome back!' });
        navigate(homeFor(u?.role));
      } else if (mode === 'register') {
        if (form.password !== form.confirm_password) { toast({ title: 'Passwords do not match', variant: 'destructive' }); return; }
        const u: any = await dispatch(registerUser({
          full_name: form.full_name, phone: form.phone, email: form.email,
          password: form.password, confirm_password: form.confirm_password,
          ref_code: form.ref_code || undefined, role: form.role,
        })).unwrap();
        toast({ title: 'Account created' });
        navigate(homeFor(u?.role));
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
    <div className="app-shell-bg relative grid min-h-screen bg-background p-3 text-foreground lg:grid-cols-2 lg:gap-3">
      <div className="absolute right-5 top-5 z-20">
        <ThemeControl />
      </div>
      <div className="vip-auth-panel glass-panel relative hidden flex-col justify-between overflow-hidden rounded-[2rem] p-12 lg:flex">
        <div className="absolute -right-20 top-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-14 left-14 h-72 w-72 rounded-full bg-info/10 blur-3xl" />
        <Link to="/" className="relative flex w-fit items-center rounded-xl bg-white p-2">
          <BrandLockup logoClassName="h-14 w-14" sloganClassName="h-12 w-64" />
        </Link>
        <div className="relative">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-card/70 px-4 py-2 text-sm font-black text-accent"><Sparkles className="h-4 w-4" /> Premium Access</div>
          <h2 className="text-5xl font-black leading-tight text-foreground">Your Number.<br /><span className="text-gradient-vnw">Your Identity.</span></h2>
          <p className="mt-4 max-w-sm text-muted-foreground">Buy & sell premium VIP, fancy and lucky mobile numbers on India's most trusted marketplace.</p>
          <Crown className="mt-10 h-24 w-24 text-accent" />
        </div>
        <p className="relative text-xs text-muted-foreground">© {new Date().getFullYear()} {APP_CONFIG.name}</p>
      </div>

      <div className="flex items-center justify-center p-4 sm:p-6">
        <form onSubmit={submit} className="vip-auth-panel glass-panel w-full max-w-md rounded-[2rem] p-6 sm:p-8">
          <Link to="/" className="mx-auto mb-6 flex w-fit items-center justify-center rounded-xl bg-white p-2 lg:hidden">
            <BrandLockup logoClassName="h-12 w-12" sloganClassName="h-10 w-52" />
          </Link>
          <h1 className="text-3xl font-black text-foreground">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">
            {mode === 'login' ? 'Sign in to your account' : mode === 'register' ? (form.role === 'DEALER' ? 'Register as a dealer to sell numbers' : 'Join VIP Number World') : 'We will review your request'}
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
                <div className="flex gap-2 text-xs">
                  {['USER', 'DEALER'].map((r) => (
                    <button type="button" key={r} onClick={() => set('role', r)}
                      className={`flex-1 rounded-2xl border px-3 py-2 font-bold ${form.role === r ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-card/40 text-muted-foreground hover:bg-muted'}`}>
                      {r === 'USER' ? 'Buyer' : 'Dealer / Seller'}
                    </button>
                  ))}
                </div>
              </>
            )}
            {mode === 'forgot' && <textarea placeholder="Reason for reset" rows={3} className={input} value={form.reason} onChange={(e) => set('reason', e.target.value)} />}
          </div>

          <button disabled={isLoading} className="btn-royal mt-5 w-full">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : title}
          </button>

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
