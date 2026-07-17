import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Cropper, { Area } from 'react-easy-crop';
import {
  Bell, Camera, ChevronRight, CreditCard, HelpCircle, Lock, MapPin, Palette,
  Save, Settings as SettingsIcon, ShieldCheck, UserRound,
} from 'lucide-react';
import { getMe, updateProfile } from '@/core/api/authAPI';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { updateUser } from '@/app/authSlice';
import { useToast } from '@/shared/hooks/use-toast';
import { PageHeader } from '@/shared/components/ui-bits';
import { ThemeControl } from '@/shared/components/ThemeControl';

const fieldClass = 'h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-4 focus:ring-ring/10 disabled:cursor-not-allowed disabled:bg-muted';
const areaClass = 'min-h-20 w-full rounded-2xl border border-input bg-background px-3 py-2.5 text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-4 focus:ring-ring/10';

function createImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', reject);
    image.src = url;
  });
}

async function cropImage(imageSrc: string, pixelCrop: Area) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return imageSrc;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );
  return canvas.toDataURL('image/png');
}

export default function Settings() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { user } = useAppSelector((s) => s.auth);
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState({ name: '', phone: '', address: '', city: '', state: '', pincode: '' });
  const [avatar, setAvatar] = useState(user?.logo || '');
  const [busy, setBusy] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  useEffect(() => {
    getMe().then((u: any) => {
      setProfile({ name: u.full_name || u.name || '', phone: u.phone || '', address: (u as any).address || '', city: '', state: '', pincode: '' });
      setAvatar(u.logo || '');
    }).catch(() => {
      setProfile({ name: user?.name || '', phone: user?.phone || '', address: '', city: '', state: '', pincode: '' });
    });
  }, []);

  const initials = (profile.name || user?.name || 'VA').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  const set = (key: keyof typeof profile, value: string) => setProfile((p) => ({ ...p, [key]: value }));

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => setCroppedArea(areaPixels), []);

  const pickImage = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageSrc(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const saveCrop = async () => {
    if (!imageSrc || !croppedArea) return;
    const nextAvatar = await cropImage(imageSrc, croppedArea);
    setAvatar(nextAvatar);
    dispatch(updateUser({ logo: nextAvatar }));
    setImageSrc('');
    toast({ title: 'Logo updated', description: 'Preview saved on your account.' });
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u: any = await updateProfile({ name: profile.name, phone: profile.phone, address: profile.address });
      dispatch(updateUser({ name: u.full_name || profile.name, full_name: u.full_name || profile.name, phone: u.phone || profile.phone, logo: avatar }));
      toast({ title: 'Profile updated' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const menu = [
    { label: 'Change password', desc: 'Update account login password', icon: Lock, to: '/account/change-password' },
    { label: 'Notifications', desc: 'View alerts and admin activity', icon: Bell, to: '/notifications' },
    { label: 'Admin settings', desc: 'Storefront and platform controls', icon: SettingsIcon, to: '/admin/settings' },
    { label: 'Privacy & security', desc: 'Sessions, devices and verification', icon: ShieldCheck },
    { label: 'Billing preferences', desc: 'Invoices and payout documents', icon: CreditCard },
    { label: 'Appearance', desc: 'Theme and display preferences', icon: Palette },
    { label: 'Support', desc: 'Help, requests and escalation', icon: HelpCircle },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Profile" subtitle="Manage account details, logo and settings" />

      <div className="grid gap-4 lg:grid-cols-[1.35fr_.85fr]">
        <section className="vnw-card overflow-hidden p-0">
          <div className="border-b border-border bg-muted/50 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative h-24 w-24 shrink-0">
                <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-[1.4rem] border border-primary/40 bg-primary text-2xl font-black text-primary-foreground shadow-lg">
                  {avatar ? <img src={avatar} alt="Profile logo" className="h-full w-full object-cover" /> : initials}
                </div>
                <button type="button" onClick={() => fileRef.current?.click()} className="absolute -bottom-2 -right-2 grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-[#6c27ee] to-[#d923c6] text-white shadow-lg">
                  <Camera className="h-4 w-4" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickImage(e.target.files?.[0])} />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-black text-foreground">{profile.name || user?.name || 'VNW Administrator'}</div>
                <div className="mt-1 truncate text-sm text-muted-foreground">{user?.email || 'admin@vipnumberworld.com'}</div>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-black text-accent">
                  <UserRound className="h-3.5 w-3.5" /> {user?.role || 'USER'} account
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={saveProfile} className="grid gap-3 p-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-black uppercase text-muted-foreground">Full name</label>
              <input className={fieldClass} value={profile.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black uppercase text-muted-foreground">Email</label>
              <input className={`${fieldClass} opacity-70`} value={user?.email || ''} disabled />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black uppercase text-muted-foreground">Phone</label>
              <input className={fieldClass} value={profile.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black uppercase text-muted-foreground">City</label>
              <input className={fieldClass} value={profile.city} onChange={(e) => set('city', e.target.value)} placeholder="City" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black uppercase text-muted-foreground">State</label>
              <input className={fieldClass} value={profile.state} onChange={(e) => set('state', e.target.value)} placeholder="State" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black uppercase text-muted-foreground">Pincode</label>
              <input className={fieldClass} value={profile.pincode} onChange={(e) => set('pincode', e.target.value)} placeholder="Pincode" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-black uppercase text-muted-foreground">Address</label>
              <textarea className={areaClass} value={profile.address} onChange={(e) => set('address', e.target.value)} placeholder="Business or billing address" />
            </div>
            <div className="sm:col-span-2">
              <button disabled={busy} className="btn-royal min-h-11 px-5 text-sm"><Save className="h-4 w-4" /> Save profile</button>
            </div>
          </form>
        </section>

        <aside className="vnw-card p-3">
          <div className="mb-2 px-2 text-sm font-black text-foreground">Settings menu</div>
          <div className="grid gap-2">
            {menu.map((item) => {
              const Icon = item.icon;
              if (item.label === 'Appearance') {
                return (
                  <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-border bg-muted/55 p-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent"><Icon className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black text-foreground">{item.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">{item.desc}</span>
                    </span>
                    <ThemeControl />
                  </div>
                );
              }
              const content = (
                <>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent"><Icon className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black text-foreground">{item.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{item.desc}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </>
              );
              return item.to ? (
                <Link key={item.label} to={item.to} className="flex items-center gap-3 rounded-2xl bg-muted/55 p-3 transition hover:bg-muted hover:shadow-sm">{content}</Link>
              ) : (
                <button key={item.label} className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3 text-left opacity-75" type="button">{content}</button>
              );
            })}
          </div>

          <div className="mt-3 rounded-2xl bg-warning-soft p-3 text-xs font-bold leading-5 text-warning">
            <MapPin className="mr-1 inline h-3.5 w-3.5" /> Address fields are ready for UI use; backend support can be wired when available.
          </div>
        </aside>
      </div>

      {imageSrc && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[1.5rem] border border-card-border bg-card p-4 text-card-foreground shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-lg font-black text-foreground">Crop logo</div>
                <div className="text-xs text-muted-foreground">Drag and zoom to fit the profile tile.</div>
              </div>
              <button onClick={() => setImageSrc('')} className="rounded-2xl bg-muted px-3 py-2 text-xs font-black text-foreground hover:bg-muted/80">Cancel</button>
            </div>
            <div className="relative h-72 overflow-hidden rounded-2xl bg-[#130f20]">
              <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
            </div>
            <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="mt-4 w-full accent-accent" />
            <button onClick={saveCrop} className="btn-royal mt-4 w-full">Use cropped logo</button>
          </div>
        </div>
      )}
    </div>
  );
}
