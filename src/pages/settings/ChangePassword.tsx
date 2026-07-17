import { useState } from 'react';
import { Eye, EyeOff, Lock, Save, ShieldCheck } from 'lucide-react';
import { changePassword } from '@/core/api/authAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader } from '@/shared/components/ui-bits';

const inputClass = 'h-11 w-full rounded-2xl border border-input bg-background px-3 pr-10 text-sm font-semibold text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/10';

export default function ChangePassword() {
  const { toast } = useToast();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ current_password: '', password: '', confirm_password: '' });

  const set = (key: keyof typeof pw, value: string) => setPw((p) => ({ ...p, [key]: value }));

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.password !== pw.confirm_password) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      await changePassword(pw);
      setPw({ current_password: '', password: '', confirm_password: '' });
      toast({ title: 'Password changed' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const TypeIcon = show ? EyeOff : Eye;
  const Field = ({ label, valueKey }: { label: string; valueKey: keyof typeof pw }) => (
    <div>
      <label className="mb-1 block text-xs font-black uppercase text-muted-foreground">{label}</label>
      <div className="relative">
        <input type={show ? 'text' : 'password'} className={inputClass} value={pw[valueKey]} onChange={(e) => set(valueKey, e.target.value)} required />
        <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <TypeIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Change Password" subtitle="Keep your VNW account secure" />
      <div className="grid gap-4 lg:grid-cols-[1fr_.75fr]">
        <form onSubmit={savePassword} className="vnw-card grid gap-3 p-4">
          <Field label="Current password" valueKey="current_password" />
          <Field label="New password" valueKey="password" />
          <Field label="Confirm password" valueKey="confirm_password" />
          <button disabled={busy} className="btn-royal mt-1 min-h-11 text-sm"><Save className="h-4 w-4" /> Update password</button>
        </form>

        <aside className="vnw-card p-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-success-soft text-success"><ShieldCheck className="h-6 w-6" /></span>
          <h3 className="mt-4 text-lg font-black text-foreground">Password tips</h3>
          <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
            <p className="rounded-2xl bg-muted p-3">Use at least 8 characters with letters, numbers and symbols.</p>
            <p className="rounded-2xl bg-muted p-3">Avoid using your phone number or business name.</p>
            <p className="rounded-2xl bg-muted p-3">Change shared admin passwords regularly.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
