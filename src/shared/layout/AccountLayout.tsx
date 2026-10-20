import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Suspense, useEffect, useRef, useState } from 'react';
import {
  Globe, Crown, LayoutDashboard, ShoppingBag, Heart, Users2, User, LogOut, Store, ListPlus,
  Tag, BadgeIndianRupee, Star, Image, MessageSquare, Settings, Gift, Menu, ArrowLeft, ListChecks, X, Ticket, Mail,
  ClipboardList, Inbox, Bell, ChevronRight, PanelLeftClose, PanelLeftOpen, ShieldCheck, UserCircle, Sparkles, Handshake, CircleHelp, CalendarClock, KeyRound, PackageSearch,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { logout } from '@/app/authSlice';
import { cn } from '@/core/lib/utils';
import { hasPermission } from '@/core/lib/permissions';
import UserAvatar from '@/shared/components/UserAvatar';
import { Loader } from '@/shared/components/ui-bits';
import { BrandLockup } from '@/shared/components/Logo';
import { contentQueryKey } from '@/shared/language/searchParams';
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet';
import { MotionPage } from '@/shared/motion/MotionPrimitives';
import { notificationsAPI } from '@/core/api/vnwAPI';
import { dm, type ModuleAccess } from '@/core/api/dealerManagement';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import '@/pages/admin/AdminControls.css';

interface MenuItem { to: string; label: string; icon: any; end?: boolean; perm?: string; }

const USER_MENU: MenuItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/orders', label: 'My Orders', icon: ShoppingBag },
  { to: '/pre-book#mine', label: 'My Pre-books', icon: CalendarClock },
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
  { to: '/admin/private-links', label: 'Offline Catalog Link', icon: KeyRound },
  { to: '/admin/delivery-cities', label: 'Home Delivery Cities', icon: Store },
  { to: '/admin/home-premium', label: 'Premium Homepage', icon: Star },
  { to: '/admin/deals-of-day', label: 'Lucky Pick of the Day', icon: Sparkles },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/payments', label: 'Payments', icon: BadgeIndianRupee },
  { to: '/admin/dealer-purchases', label: 'Dealer Purchases', icon: PackageSearch },
  { to: '/admin/prebooks', label: 'Pre-books & Refunds', icon: CalendarClock },
  { to: '/admin/sell-requests', label: 'Sell Requests', icon: Inbox },
  { to: '/admin/approvals', label: 'Approvals', icon: ClipboardList },
  { to: '/admin/users', label: 'Users', icon: Users2 },
  { to: '/admin/dealers', label: 'Dealers', icon: Store },
  { to: '/admin/payouts', label: 'Payouts', icon: BadgeIndianRupee },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/testimonials', label: 'Testimonials', icon: MessageSquare },
  { to: '/admin/trusted-clients', label: 'Trusted Clients', icon: Handshake },
  { to: '/admin/faqs', label: 'FAQs', icon: CircleHelp },
  { to: '/admin/carousel', label: 'Carousel', icon: Image },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { to: '/admin/subscribers', label: 'Subscribers', icon: Mail },
  { to: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
  { to: '/admin/languages', label: 'Languages', icon: Globe },
  { to: '/account', label: 'Profile', icon: User },
];

const ADMIN_GROUPS = [
  { label: 'Overview', items: ['Dashboard'] },
  { label: 'Catalog', items: ['Numbers', 'Offline Catalog Link', 'Premium Homepage', 'Home Delivery Cities', 'Lucky Pick of the Day', 'Carousel', 'Coupons'] },
  { label: 'Operations', items: ['Orders', 'Payments', 'Dealer Purchases', 'Pre-books & Refunds', 'Sell Requests', 'Approvals', 'Payouts'] },
  { label: 'People', items: ['Users', 'Dealers', 'Subscribers'] },
  { label: 'Trust', items: ['Reviews', 'Testimonials', 'Trusted Clients', 'FAQs', 'Messages', 'Settings', 'Languages', 'Profile'] },
];

const ROLE_HOME: Record<string, string> = {
  ADMIN: '/admin',
  EMPLOYEE: '/employee',
  DEALER: '/dealer',
  USER: '/dashboard',
};

const EXTRA_LABELS: Record<string, string> = {
  '/account': 'Profile',
  '/account/change-password': 'Change Password',
  '/notifications': 'Notifications',
};

export default function AccountLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((s) => s.auth);
  const role = (user?.role || 'USER').toUpperCase();
  const [moduleAccess, setModuleAccess] = useState<ModuleAccess | null>(null);
  useEffect(() => {
    let active = true;
    setModuleAccess(null);
    dm<ModuleAccess>('capabilities').then(result => { if (active) setModuleAccess(result); }).catch(() => undefined);
    return () => { active = false; };
  }, [user?.user_id]);
  const existingMenu = role === 'ADMIN' ? ADMIN_MENU : role === 'EMPLOYEE' ? EMPLOYEE_MENU : role === 'DEALER' ? DEALER_MENU : USER_MENU;
  const moduleMenu: MenuItem[] = [];
  if (moduleAccess?.enabled && (moduleAccess.admin || (role === 'EMPLOYEE' && moduleAccess.permissions.length))) moduleMenu.push({ to: role === 'ADMIN' ? '/admin/dealer-management' : '/employee/dealer-management', label: 'Dealer Management', icon: Handshake });
  if (moduleAccess?.enabled && moduleAccess.statement) moduleMenu.push({ to: '/dealer-statement', label: 'Dealer Statement', icon: ClipboardList });
  const baseMenu = [...existingMenu, ...moduleMenu];
  // Hide items the user lacks permission for (ADMIN/EMPLOYEE bypass via hasPermission).
  const menu = baseMenu.filter((m) => !m.perm || hasPermission(user, m.perm));
  const sidebarTrigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationRows, setNotificationRows] = useState<any[]>([]);
  const [visibleNotifications, setVisibleNotifications] = useState(7);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');

  const current = [...menu].sort((a, b) => b.to.length - a.to.length).find((m) => (
    m.end ? location.pathname === m.to : location.pathname === m.to || location.pathname.startsWith(`${m.to}/`)
  ));
  const pageLabel = location.pathname === '/admin/numbers/recycle' ? 'Recycle' : current?.label || EXTRA_LABELS[location.pathname] || 'Dashboard';
  const homePath = ROLE_HOME[role] || '/dashboard';
  const isAdmin = role === 'ADMIN';
  const userName = user?.name || user?.full_name || 'User';
  const userEmail = user?.email || user?.phone || `${role.toLowerCase()}@vipnumberworld.com`;
  const initials = userName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || role.slice(0, 2);

  const groupedMenu = isAdmin
    ? [...ADMIN_GROUPS, { label: 'Standalone Dealer Module', items: ['Dealer Management', 'Dealer Statement'] }].map((g) => ({ ...g, links: menu.filter((m) => g.items.includes(m.label)) })).filter((g) => g.links.length)
    : [{ label: role === 'USER' ? 'Account' : `${role.toLowerCase()} panel`, links: menu }];

  const doLogout = () => dispatch(logout());

  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!notificationsOpen) return;
    let active = true;
    setVisibleNotifications(7);
    setNotificationsLoading(true);
    setNotificationsError('');
    notificationsAPI.get().then((data: any) => {
      if (active) setNotificationRows(Array.isArray(data) ? data : data?.items || []);
    }).catch(() => { if (active) setNotificationsError('Could not load notifications.'); })
      .finally(() => { if (active) setNotificationsLoading(false); });
    return () => { active = false; };
  }, [notificationsOpen]);

  const renderNavList = ({ onItem, compact = false }: { onItem?: () => void; compact?: boolean }) => (
    <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 py-2 [scrollbar-width:thin]">
      {groupedMenu.map((group) => (
        <div key={group.label} className="mb-2 last:mb-0">
          {!compact && (
            <div className="mb-1 px-2 text-[9px] font-black uppercase text-muted-foreground">
              {group.label}
            </div>
          )}
          <div className="space-y-0.5">
            {group.links.map((m) => (
              <NavLink key={m.to} to={m.to} end={m.end} onClick={onItem} title={compact ? m.label : undefined}
                className={({ isActive }) => cn(
                  'group relative flex min-h-8 items-center rounded-lg text-xs font-bold transition-all',
                  compact ? 'justify-center px-2' : 'gap-2 px-2',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}>
                {({ isActive }) => (
                  <>
                    <span className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-lg transition', isActive ? 'bg-primary-foreground/10 text-primary-foreground' : 'bg-sidebar-accent text-sidebar-primary group-hover:bg-card')}>
                      <m.icon className="h-4 w-4" />
                    </span>
                    {!compact && <span className="min-w-0 truncate">{m.label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  const renderSidebar = ({ onItem, mobile = false }: { onItem?: () => void; mobile?: boolean } = {}) => (
    <div className={cn(
      'flex h-full flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm',
      mobile ? 'rounded-r-[1.6rem]' : 'rounded-none'
    )}>
      <div className={cn('flex items-center gap-3 border-b border-sidebar-border px-3 py-3', collapsed && !mobile ? 'justify-center' : 'justify-between')}>
        <Link to={homePath} onClick={onItem} className={cn('flex min-w-0 flex-col items-start gap-0.5', collapsed && !mobile && 'items-center')}>
          {collapsed && !mobile
            ? <BrandLockup className="dark:px-1" logoClassName="sm:h-10 sm:w-10" sloganClassName="hidden" />
            : <BrandLockup logoClassName="sm:h-10 sm:w-10" sloganClassName="h-8 w-[132px] sm:h-8 sm:w-[132px] xl:w-[132px] 2xl:w-[132px]" />}
        </Link>
        {mobile && <button aria-label="Close sidebar" onClick={onItem} className="grid h-10 w-10 place-items-center rounded-2xl bg-sidebar-accent text-sidebar-accent-foreground"><X className="h-5 w-5" /></button>}
      </div>

      {renderNavList({ onItem, compact: collapsed && !mobile })}

      <div className="space-y-1 p-2">
        {(!collapsed || mobile) && (
          <Link to="/account" onClick={onItem} className="flex items-center gap-3 rounded-2xl border border-sidebar-border bg-sidebar-accent p-2 shadow-sm transition hover:bg-sidebar-accent/80">
            <UserAvatar user={user} className="h-8 w-8" />
            <span className="min-w-0">
              <span translate="no" className="block truncate text-sm font-black text-sidebar-foreground">{userName}</span>
              <span translate="no" className="block truncate text-xs text-muted-foreground">{userEmail}</span>
            </span>
          </Link>
        )}
        <Link to="/" onClick={onItem} title={collapsed && !mobile ? 'Back to Store' : undefined}
          className={cn('flex min-h-9 items-center rounded-2xl bg-sidebar-accent text-sm font-bold text-sidebar-accent-foreground shadow-sm transition hover:bg-sidebar-accent/80', collapsed && !mobile ? 'justify-center px-2' : 'gap-2 px-2')}>
          <ArrowLeft className="h-4 w-4" /> {(!collapsed || mobile) && 'Back to Store'}
        </Link>
        <button onClick={doLogout} title={collapsed && !mobile ? 'Logout' : undefined}
          className={cn('flex min-h-9 w-full items-center rounded-2xl bg-sidebar-accent text-sm font-bold text-destructive shadow-sm transition hover:bg-destructive/10', collapsed && !mobile ? 'justify-center px-2' : 'gap-2 px-2')}>
          <LogOut className="h-4 w-4" /> {(!collapsed || mobile) && 'Logout'}
        </button>
      </div>
    </div>
  );

  const bottomItems = [
    menu[0],
    menu.find((m) => ['Numbers', 'My Listings', 'My Orders'].includes(m.label)) || menu[1],
    menu.find((m) => ['Orders', 'Sales', 'Sell a Number'].includes(m.label)) || menu[2],
    menu.find((m) => ['Users', 'Wishlist', 'Dealers'].includes(m.label)) || menu[3],
  ].filter(Boolean) as MenuItem[];

  const unreadCount = notificationRows.filter((row) => String(row.is_read ?? row.read).toLowerCase() === 'false' || row.is_read === 0).length;
  const markNotificationsRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotificationRows((rows) => rows.map((row) => ({ ...row, is_read: 'true' })));
    } catch { setNotificationsError('Could not mark notifications as read.'); }
  };

  return (
    <div className={cn('customer-motion-scope app-shell-bg flex min-h-screen bg-background text-foreground', isAdmin && 'admin-shell')}>
      <aside className={cn('sticky top-0 hidden h-screen shrink-0 transition-[width] duration-300 lg:block', collapsed ? 'w-[68px]' : 'w-[224px]')}>
        {renderSidebar()}
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" onCloseAutoFocus={(event) => { event.preventDefault(); sidebarTrigger.current?.focus({ preventScroll: true }); }} aria-describedby={undefined} className="admin-sidebar-drawer z-[60] h-[100dvh] w-[min(320px,88vw)] overflow-hidden rounded-r-[1.6rem] border-0 bg-sidebar p-0 [&>button:last-child]:hidden">
          <SheetTitle className="sr-only">Account navigation</SheetTitle>
          {renderSidebar({ onItem: () => setOpen(false), mobile: true })}
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="vip-account-header sticky top-0 z-30 border-b border-border bg-background/95 px-3 py-2 shadow-sm backdrop-blur-lg lg:px-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button ref={sidebarTrigger} onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-2xl border border-border bg-card text-foreground shadow-sm lg:hidden" aria-label="Open sidebar">
                <Menu className="h-5 w-5" />
              </button>
              <button onClick={() => setCollapsed((v) => !v)} className="hidden h-10 w-10 place-items-center rounded-2xl border border-border bg-card text-foreground shadow-sm transition hover:-translate-y-0.5 lg:grid" aria-label="Toggle sidebar">
                {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
              </button>
              <div className="hidden h-8 w-px bg-border sm:block" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground sm:text-sm">
                  <Link to={homePath} className="hover:text-accent">Home</Link>
                  <ChevronRight className="h-4 w-4 shrink-0" />
                  <span className="truncate font-black text-foreground">{pageLabel}</span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">


              <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <PopoverTrigger asChild><button aria-label="Notifications" aria-expanded={notificationsOpen} className="relative grid h-10 w-10 place-items-center rounded-2xl border border-border bg-card text-foreground shadow-sm transition hover:-translate-y-0.5">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-black text-primary-foreground">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                </button></PopoverTrigger>
                <PopoverContent align="end" sideOffset={8} className="z-[120] w-[min(340px,calc(100vw-24px))] rounded-xl border-popover-border p-2 shadow-xl">
                    <div className="mb-1.5 flex items-center justify-between gap-2 px-1">
                      <b className="text-sm text-popover-foreground">Notifications</b>
                      {unreadCount > 0 && <button onClick={markNotificationsRead} className="rounded-lg px-2 py-1 text-[10px] font-black text-accent hover:bg-accent/10">Mark all read</button>}
                    </div>
                    <div className="max-h-72 space-y-1 overflow-y-auto">
                      {notificationsLoading && <p className="p-3 text-xs text-muted-foreground">Loading notifications…</p>}
                      {notificationsError && <p role="status" className="p-3 text-xs text-destructive">{notificationsError}</p>}
                      {!notificationsLoading && !notificationsError && notificationRows.length === 0 && <p className="p-3 text-xs text-muted-foreground">No notifications yet.</p>}
                      {notificationRows.slice(0, visibleNotifications).map((n) => (
                        <div key={n.notification_id} className="w-full rounded-lg bg-muted px-2.5 py-2 text-left">
                          <span className="flex items-center justify-between gap-3">
                            <span className="text-xs font-black text-foreground">{n.title}</span>
                            <span className="text-[10px] font-bold text-muted-foreground">{n.created_at ? new Date(n.created_at).toLocaleDateString('en-IN') : ''}</span>
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-4 text-muted-foreground">{n.message}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      {notificationRows.length > visibleNotifications && <button onClick={() => setVisibleNotifications((count) => count + 7)} className="min-h-8 flex-1 rounded-lg border border-border text-[11px] font-black text-foreground hover:bg-muted">View 7 more</button>}
                      <button onClick={() => { setNotificationsOpen(false); navigate('/notifications'); }} className="min-h-8 flex-1 rounded-lg bg-primary px-3 text-[11px] font-black text-primary-foreground transition hover:bg-primary/90">View all</button>
                    </div>
                </PopoverContent>
              </Popover>

              <div className="relative">
                <button aria-label="Open profile" onClick={() => { navigate('/account'); setNotificationsOpen(false); }} className="flex h-10 min-w-10 items-center gap-2 rounded-2xl border border-border bg-card px-1.5 pr-2.5 shadow-sm transition hover:-translate-y-0.5 md:min-w-[176px] lg:min-w-[205px]">
                  <UserAvatar user={user} className="h-8 w-8" />
                  <span className="hidden text-left leading-tight md:block">
                    <span translate="no" className="block max-w-[150px] truncate text-xs font-black text-foreground">{userName}</span>
                    <span className="block text-[10px] font-bold text-muted-foreground">{role}</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="account-content flex-1 py-4 pb-24 lg:pb-5">
          <MotionPage routeKey={location.pathname + contentQueryKey(new URLSearchParams(location.search))}>
            <Suspense fallback={<Loader label="Loading screen" />}><Outlet /></Suspense>
          </MotionPage>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card/90 shadow-lg backdrop-blur-2xl lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {bottomItems.map((m) => (
          <NavLink key={m.to} to={m.to} end={m.end}
            className={({ isActive }) => cn('flex flex-col items-center gap-1 py-2 text-[10px] font-bold', isActive ? 'text-accent' : 'text-muted-foreground')}>
            {({ isActive }) => (
              <>
                <span className={cn('grid h-8 w-8 place-items-center rounded-2xl transition', isActive && 'bg-accent/10 shadow-sm')}>
                  <m.icon className="h-5 w-5" />
                </span>
                <span>{m.label.split(' ')[0]}</span>
              </>
            )}
          </NavLink>
        ))}
        <button onClick={() => navigate('/account')} className="flex flex-col items-center gap-1 py-2 text-[10px] font-bold text-muted-foreground">
          <span className="grid h-8 w-8 place-items-center rounded-2xl"><User className="h-5 w-5" /></span>
          Profile
        </button>
      </nav>
    </div>
  );
}
