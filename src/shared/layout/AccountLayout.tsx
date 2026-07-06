import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Crown, LayoutDashboard, ShoppingBag, Heart, Users2, User, LogOut, Store, ListPlus,
  Tag, BadgeIndianRupee, Star, Image, MessageSquare, Settings, Gift, Menu, ArrowLeft, ListChecks, X, Ticket, Mail,
  ClipboardList, Inbox,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { logout } from '@/app/authSlice';
import { cn } from '@/core/lib/utils';
import { hasPermission } from '@/core/lib/permissions';
import { Logo as BrandLogo } from '@/shared/components/Logo';

interface MenuItem { to: string; label: string; icon: any; end?: boolean; perm?: string; }

const USER_MENU: MenuItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/orders', label: 'My Orders', icon: ShoppingBag },
  { to: '/sell', label: 'Sell a Number', icon: Tag, perm: 'user.sell' },
  { to: '/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/referrals', label: 'Referrals', icon: Gift },
  { to: '/account', label: 'Profile', icon: User },
];
const DEALER_MENU: MenuItem[] = [
  { to: '/dealer', label: 'Dashboard', icon: LayoutDashboard, end: true, perm: 'dealer.dashboard' },
  { to: '/dealer/listings', label: 'My Listings', icon: ListChecks, perm: 'dealer.listings.view' },
  { to: '/dealer/listings/new', label: 'Add Number', icon: ListPlus, perm: 'dealer.listings.create' },
  { to: '/dealer/sales', label: 'Sales', icon: BadgeIndianRupee, perm: 'dealer.sales' },
  { to: '/dealer/payouts', label: 'Payouts', icon: BadgeIndianRupee, perm: 'dealer.payouts' },
  { to: '/dealer/profile', label: 'Dealer Profile', icon: Store, perm: 'dealer.profile' },
  { to: '/orders', label: 'My Orders', icon: ShoppingBag },
];
const EMPLOYEE_MENU: MenuItem[] = [
  { to: '/employee', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/employee/numbers', label: 'Numbers', icon: Crown },
  { to: '/employee/sell', label: 'Sell Requests', icon: Inbox },
  { to: '/employee/users', label: 'Users', icon: Users2 },
  { to: '/employee/submissions', label: 'My Submissions', icon: ClipboardList },
];
const ADMIN_MENU: MenuItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/numbers', label: 'Numbers', icon: Crown },
  { to: '/admin/categories', label: 'Categories', icon: Tag },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/sell-requests', label: 'Sell Requests', icon: Inbox },
  { to: '/admin/approvals', label: 'Approvals', icon: ClipboardList },
  { to: '/admin/users', label: 'Users', icon: Users2 },
  { to: '/admin/dealers', label: 'Dealers', icon: Store },
  { to: '/admin/payouts', label: 'Payouts', icon: BadgeIndianRupee },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/testimonials', label: 'Testimonials', icon: MessageSquare },
  { to: '/admin/banners', label: 'Banners', icon: Image },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { to: '/admin/subscribers', label: 'Subscribers', icon: Mail },
  { to: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AccountLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const role = (user?.role || 'USER').toUpperCase();
  const baseMenu = role === 'ADMIN' ? ADMIN_MENU : role === 'EMPLOYEE' ? EMPLOYEE_MENU : role === 'DEALER' ? DEALER_MENU : USER_MENU;
  // Hide items the user lacks permission for (ADMIN/EMPLOYEE bypass via hasPermission).
  const menu = baseMenu.filter((m) => !m.perm || hasPermission(user, m.perm));
  const [open, setOpen] = useState(false);

  const NavList = ({ onItem }: { onItem?: () => void }) => (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3">
      {menu.map((m) => (
        <NavLink key={m.to} to={m.to} end={m.end} onClick={onItem}
          className={({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
            isActive ? 'bg-white/70 text-[#7c2cff] font-black shadow-sm' : 'text-[#1d1830]/68 hover:bg-white/50 hover:text-[#1d1830]')}>
          <m.icon className="h-4 w-4" /> {m.label}
        </NavLink>
      ))}
    </nav>
  );

  const SidebarInner = ({ onItem }: { onItem?: () => void }) => (
    <div className="flex h-full flex-col border-r border-white/70 bg-white/42 backdrop-blur-2xl">
      <div className="flex items-center justify-between border-b border-white/70 px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <BrandLogo className="h-11 w-14 object-contain" />
          <span className="leading-tight">
            <span className="block text-sm font-black text-gold">VNW</span>
            <span className="block text-[10px] font-bold capitalize text-[#1d1830]/55">{role.toLowerCase()} panel</span>
          </span>
        </Link>
        {onItem && <button onClick={onItem} className="text-[#1d1830]/70 lg:hidden"><X className="h-5 w-5" /></button>}
      </div>
      <NavList onItem={onItem} />
      <div className="border-t border-white/70 p-3">
        <Link to="/" onClick={onItem} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#1d1830]/70 hover:bg-white/50"><ArrowLeft className="h-4 w-4" /> Back to Store</Link>
        <button onClick={() => dispatch(logout())} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-rose-500 hover:bg-white/50"><LogOut className="h-4 w-4" /> Logout</button>
      </div>
    </div>
  );

  const bottomItems = menu.slice(0, 4);

  return (
    <div className="app-shell-bg flex min-h-screen bg-background">
      {/* desktop sidebar (sticky full height) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block"><SidebarInner /></aside>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-[#1d1830]/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72"><SidebarInner onItem={() => setOpen(false)} /></div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* FIXED header */}
        <header className="sticky top-0 z-30 m-3 flex items-center justify-between rounded-2xl border border-white/70 bg-white/64 px-4 py-3 shadow-sm backdrop-blur-2xl lg:mx-6">
          <div className="flex items-center gap-3">
            <button className="text-[#7c2cff] lg:hidden" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
            <span className="text-sm text-muted-foreground">Welcome, <span className="font-black text-[#1d1830]">{user?.name || 'User'}</span></span>
          </div>
          <button onClick={() => navigate('/account')} className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/60 px-3 py-1.5 text-sm shadow-sm">
            <span className="grid h-7 w-7 place-items-center rounded-xl royal-gradient-bg text-white"><User className="h-3.5 w-3.5" /></span>
            <span className="hidden font-black text-[#1d1830] sm:inline">{role}</span>
          </button>
        </header>

        <main className="flex-1 p-4 pb-24 lg:p-6 lg:pb-6"><Outlet /></main>
      </div>

      {/* mobile bottom nav (dashboard) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/70 bg-white/72 backdrop-blur-2xl lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {bottomItems.map((m) => (
          <NavLink key={m.to} to={m.to} end={m.end}
            className={({ isActive }) => cn('flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold', isActive ? 'text-[#7c2cff]' : 'text-muted-foreground')}>
            <m.icon className="h-5 w-5" /> {m.label.split(' ')[0]}
          </NavLink>
        ))}
        <button onClick={() => setOpen(true)} className="flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium text-muted-foreground"><Menu className="h-5 w-5" /> Menu</button>
      </nav>
    </div>
  );
}
