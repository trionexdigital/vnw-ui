import { useEffect, useState } from 'react';
import { updateProfile, changePassword, getMe } from '@/core/api/authAPI';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { updateUser } from '@/app/authSlice';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader, Panel } from '@/shared/components/ui-bits';

export default function Settings() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { user } = useAppSelector((s) => s.auth);
  const [profile, setProfile] = useState({ name: '', phone: '', address: '' });
  const [pw, setPw] = useState({ current_password: '', password: '', confirm_password: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getMe().then((u: any) => setProfile({ name: u.full_name || u.name || '', phone: u.phone || '', address: u.address || '' })).catch(() => {
      setProfile({ name: user?.name || '', phone: user?.phone || '', address: '' });
    });
  }, []);

  const input = 'w-full rounded-lg border border-card-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-primary';

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { const u: any = await updateProfile(profile); dispatch(updateUser({ name: u.full_name, full_name: u.full_name, phone: u.phone })); toast({ title: 'Profile updated' }); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.password !== pw.confirm_password) { toast({ title: 'Passwords do not match', variant: 'destructive' }); return; }
    setBusy(true);
    try { await changePassword(pw); setPw({ current_password: '', password: '', confirm_password: '' }); toast({ title: 'Password changed' }); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="Profile & Settings" subtitle="Manage your account details" />

      <Panel className="mb-6">
        <h3 className="mb-4 font-semibold text-foreground">Profile Information</h3>
        <form onSubmit={saveProfile} className="space-y-3">
          <div><label className="mb-1 block text-xs text-muted-foreground">Full Name</label>
            <input className={input} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required /></div>
          <div><label className="mb-1 block text-xs text-muted-foreground">Email</label>
            <input className={input + ' opacity-60'} value={user?.email || ''} disabled /></div>
          <div><label className="mb-1 block text-xs text-muted-foreground">Phone</label>
            <input className={input} value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
          <div><label className="mb-1 block text-xs text-muted-foreground">Address</label>
            <textarea className={input} rows={2} value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} /></div>
          <button disabled={busy} className="btn-gold">Save Profile</button>
        </form>
      </Panel>

      <Panel>
        <h3 className="mb-4 font-semibold text-foreground">Change Password</h3>
        <form onSubmit={savePassword} className="space-y-3">
          <input type="password" className={input} placeholder="Current password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} required />
          <input type="password" className={input} placeholder="New password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} required />
          <input type="password" className={input} placeholder="Confirm new password" value={pw.confirm_password} onChange={(e) => setPw({ ...pw, confirm_password: e.target.value })} required />
          <button disabled={busy} className="btn-gold-outline">Update Password</button>
        </form>
      </Panel>
    </div>
  );
}
