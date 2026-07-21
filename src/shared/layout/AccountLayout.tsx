import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  Crown, LayoutDashboard, ShoppingBag, Heart, Users2, User, LogOut, Store, ListPlus,
  Tag, BadgeIndianRupee, Star, Image, MessageSquare, Settings, Gift, Menu, ArrowLeft, ListChecks, X, Ticket, Mail,
  ClipboardList, Inbox, Bell, ChevronRight, PanelLeftClose, PanelLeftOpen, ShieldCheck, Search, UserCircle,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { logout } from '@/app/authSlice';
import { cn } from '@/core/lib/utils';
import { hasPermission } from '@/core/lib/permissions';
import { BrandLockup } from '@/shared/components/Logo';
import { ThemeControl } from '@/shared/components/ThemeControl';
import { AnimatePresence, motion } from 'framer-motion';
import { MotionPage } from '@/shared/motion/MotionPrimitives';

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
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/sell-requests', label: 'Sell Requests', icon: Inbox },
  { to: '/admin/approvals', label: 'Approvals', icon: ClipboardList },
  { to: '/admin/users', label: 'Users', icon: Users2 },
  { to: '/admin/dealers', label: 'Dealers', icon: Store },
  { to: '/admin/payouts', label: 'Payouts', icon: BadgeIndianRupee },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/testimonials', label: 'Testimonials', icon: MessageSquare },
  { to: '/admin/carousel', label: 'Carousel', icon: Image },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { to: '/admin/subscribers', label: 'Subscribers', icon: Mail },
  { to: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

const ADMIN_GROUPS = [
  { label: 'Overview', items: ['Dashboard'] },
  { label: 'Catalog', items: ['Numbers', 'Carousel', 'Coupons'] },
  { label: 'Operations', items: ['Orders', 'Sell Requests', 'Approvals', 'Payouts'] },
  { label: 'People', items: ['Users', 'Dealers', 'Subscribers'] },
  { label: 'Trust', items: ['Reviews', 'Testimonials', 'Messages', 'Settings'] },
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
  const baseMenu = role === 'ADMIN' ? ADMIN_MENU : role === 'EMPLOYEE' ? EMPLOYEE_MENU : role === 'DEALER' ? DEALER_MENU : USER_MENU;
  // Hide items the user lacks permission for (ADMIN/EMPLOYEE bypass via hasPermission).
  const menu = baseMenu.filter((m) => !m.perm || hasPermission(user, m.perm));
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const current = [...menu].sort((a, b) => b.to.length - a.to.length).find((m) => (
    m.end ? location.pathname === m.to : location.pathname === m.to || location.pathname.startsWith(`${m.to}/`)
  ));
  const pageLabel = current?.label || EXTRA_LABELS[location.pathname] || 'Dashboard';
  const homePath = ROLE_HOME[role] || '/dashboard';
  const isAdmin = role === 'ADMIN';
  const userName = user?.name || 'User';
  const userEmail = user?.email || user?.phone || `${role.toLowerCase()}@vipnumberworld.com`;
  const initials = userName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || role.slice(0, 2);

  const groupedMenu = isAdmin
    ? ADMIN_GROUPS.map((g) => ({ ...g, links: menu.filter((m) => g.items.includes(m.label)) })).filter((g) => g.links.length)
    : [{ label: role === 'USER' ? 'Account' : `${role.toLowerCase()} panel`, links: menu }];

  const doLogout = () => dispatch(logout());

  useEffect(() => {
    const closeFloatingMenus = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (notificationsRef.current?.contains(target) || profileRef.current?.contains(target)) return;
      setNotificationsOpen(false);
      setProfileOpen(false);
    };
    document.addEventListener('mousedown', closeFloatingMenus);
    document.addEventListener('touchstart', closeFloatingMenus);
    return () => {
      document.removeEventListener('mousedown', closeFloatingMenus);
      document.removeEventListener('touchstart', closeFloatingMenus);
    };
  }, []);

  const NavList = ({ onItem, compact = false }: { onItem?: () => void; compact?: boolean }) => (
    <nav className="flex-1 overflow-y-auto px-2.5 py-2 [scrollbar-width:thin]">
      {groupedMenu.map((group) => (
        <div key={group.label} className="mb-4 last:mb-0">
          {!compact && (
            <div className="mb-2 px-3 text-[10px] font-black uppercase text-muted-foreground">
              {group.label}
            </div>
          )}
          <div className="space-y-1.5">
            {group.links.map((m) => (
              <NavLink key={m.to} to={m.to} end={m.end} onClick={onItem} title={compact ? m.label : undefined}
                className={({ isActive }) => cn(
                  'group relative flex min-h-10 items-center rounded-lg text-sm font-bold transition-all',
                  compact ? 'justify-center px-2' : 'gap-3 px-3',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}>
                {({ isActive }) => (
                  <>
                    <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg transition', isActive ? 'bg-primary-foreground/10 text-primary-foreground' : 'bg-sidebar-accent text-sidebar-primary group-hover:bg-card')}>
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

  const SidebarInner = ({ onItem, mobile = false }: { onItem?: () => void; mobile?: boolean }) => (
    <div className={cn(
      'flex h-full flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm',
      mobile ? 'rounded-r-[1.6rem]' : 'rounded-none'
    )}>
      <div className={cn('flex items-center gap-3 border-b border-sidebar-border px-3 py-3', collapsed && !mobile ? 'justify-center' : 'justify-between')}>
        <Link to={homePath} onClick={onItem} className={cn('flex min-w-0 flex-col items-start gap-0.5', collapsed && !mobile && 'items-center')}>
          {collapsed && !mobile
            ? <BrandLockup className="dark:px-1" logoClassName="sm:h-10 sm:w-10" sloganClassName="hidden" />
            : <BrandLockup logoClassName="sm:h-10 sm:w-10" sloganClassName="h-8 w-[132px] sm:h-8 sm:w-[132px] xl:w-[132px] 2xl:w-[132px]" />}
          {(!collapsed || mobile) && <span className="pl-1 text-[10px] font-bold capitalize text-muted-foreground">{role.toLowerCase()} panel</span>}
        </Link>
        {mobile && <button onClick={onItem} className="grid h-10 w-10 place-items-center rounded-2xl bg-sidebar-accent text-sidebar-accent-foreground"><X className="h-5 w-5" /></button>}
      </div>

      <NavList onItem={onItem} compact={collapsed && !mobile} />

      <div className="space-y-2 p-3">
        {(!collapsed || mobile) && (
          <Link to="/account" onClick={onItem} className="flex items-center gap-3 rounded-2xl border border-sidebar-border bg-sidebar-accent p-3 shadow-sm transition hover:bg-sidebar-accent/80">
            <span className="royal-gradient-bg grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-sm font-black text-primary-foreground">{initials}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black text-sidebar-foreground">{userName}</span>
              <span className="block truncate text-xs text-muted-foreground">{userEmail}</span>
            </span>
          </Link>
        )}
        <Link to="/" onClick={onItem} title={collapsed && !mobile ? 'Back to Store' : undefined}
          className={cn('flex min-h-11 items-center rounded-2xl bg-sidebar-accent text-sm font-bold text-sidebar-accent-foreground shadow-sm transition hover:bg-sidebar-accent/80', collapsed && !mobile ? 'justify-center px-2' : 'gap-3 px-3')}>
          <ArrowLeft className="h-4 w-4" /> {(!collapsed || mobile) && 'Back to Store'}
        </Link>
        <button onClick={doLogout} title={collapsed && !mobile ? 'Logout' : undefined}
          className={cn('flex min-h-11 w-full items-center rounded-2xl bg-sidebar-accent text-sm font-bold text-destructive shadow-sm transition hover:bg-destructive/10', collapsed && !mobile ? 'justify-center px-2' : 'gap-3 px-3')}>
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

  const notifications = [
    { title: 'New VIP number added', text: 'A premium listing is waiting for review.', time: '2 min' },
    { title: 'Order activity', text: 'Recent order status needs attention.', time: '18 min' },
    { title: 'Customer message', text: 'A buyer asked about number transfer.', time: '1 hr' },
  ];

  return (
    <div className="app-shell-bg flex min-h-screen bg-background text-foreground">
      <aside className={cn('sticky top-0 hidden h-screen shrink-0 transition-[width] duration-300 lg:block', collapsed ? 'w-[68px]' : 'w-[244px]')}>
        <SidebarInner />
      </aside>

      <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <motion.div className="absolute left-0 top-0 h-full w-[min(300px,84vw)] p-2 pr-0" initial={{ x: -28 }} animate={{ x: 0 }} exit={{ x: -28 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}>
            <SidebarInner onItem={() => setOpen(false)} mobile />
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-3 py-2 shadow-sm backdrop-blur-lg lg:px-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-2xl border border-border bg-card text-foreground shadow-sm lg:hidden" aria-label="Open sidebar">
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
                <div className="mt-0.5 hidden text-xs text-muted-foreground sm:block">Welcome back, <span className="font-black text-foreground">{userName}</span></div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button className="hidden h-10 items-center gap-2 rounded-2xl border border-border bg-card px-4 text-sm font-black text-foreground shadow-sm transition hover:-translate-y-0.5 xl:inline-flex" onClick={() => navigate(isAdmin ? '/admin/numbers' : homePath)}>
                <Search className="h-4 w-4 text-accent" /> Quick Find
              </button>

              <ThemeControl />

              <div className="relative" ref={notificationsRef}>
                <button onClick={() => { setNotificationsOpen((v) => !v); setProfileOpen(false); }} aria-label="Notifications" className="relative grid h-10 w-10 place-items-center rounded-2xl border border-border bg-card text-foreground shadow-sm transition hover:-translate-y-0.5">
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gradient-to-br from-[#ff8a21] to-[#d923c6] px-1 text-[10px] font-black text-white">3</span>
                </button>
                {notificationsOpen && (
                  <div className="fixed left-3 right-3 top-[68px] z-40 rounded-[1.25rem] border border-popover-border bg-popover p-2.5 text-popover-foreground shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[360px]">
                    <div className="mb-2 flex items-center justify-between px-1">
                      <b className="text-sm text-popover-foreground">Notifications</b>
                      <span className="rounded-full bg-accent/15 px-2 py-1 text-[10px] font-black text-accent">3 new</span>
                    </div>
                    <div className="space-y-2">
                      {notifications.map((n) => (
                        <button key={n.title} className="w-full rounded-2xl bg-muted p-3 text-left transition hover:bg-accent/10">
                          <span className="flex items-center justify-between gap-3">
                            <span className="text-sm font-black text-foreground">{n.title}</span>
                            <span className="text-[10px] font-bold text-muted-foreground">{n.time}</span>
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-muted-foreground">{n.text}</span>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => { setNotificationsOpen(false); navigate('/notifications'); }} className="mt-2 flex h-10 w-full items-center justify-center rounded-2xl bg-primary text-xs font-black text-primary-foreground transition hover:bg-primary/90">
                      View all notifications
                    </button>
                  </div>
                )}
              </div>

              <div className="relative" ref={profileRef}>
                <button onClick={() => { setProfileOpen((v) => !v); setNotificationsOpen(false); }} className="flex h-10 items-center gap-2 rounded-2xl border border-border bg-card px-1.5 pr-2.5 shadow-sm transition hover:-translate-y-0.5">
                  <span className="royal-gradient-bg grid h-8 w-8 place-items-center rounded-xl text-xs font-black text-primary-foreground">{initials}</span>
                  <span className="hidden text-left leading-tight md:block">
                    <span className="block max-w-28 truncate text-xs font-black text-foreground">{userName}</span>
                    <span className="block text-[10px] font-bold text-muted-foreground">{role}</span>
                  </span>
                </button>
                {profileOpen && (
                  <div className="fixed left-3 right-3 top-[68px] z-40 rounded-[1.25rem] border border-popover-border bg-popover p-2.5 text-popover-foreground shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-72">
                    <div className="rounded-2xl bg-muted p-3">
                      <div className="flex items-center gap-3">
                        <span className="royal-gradient-bg grid h-11 w-11 place-items-center rounded-2xl text-sm font-black text-primary-foreground">{initials}</span>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black text-foreground">{userName}</div>
                          <div className="truncate text-xs text-muted-foreground">{userEmail}</div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 grid gap-1">
                      <button onClick={() => { setProfileOpen(false); navigate('/account'); }} className="flex items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm font-bold text-foreground/80 hover:bg-muted"><UserCircle className="h-4 w-4 text-accent" /> Profile</button>
                      <button className="flex items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm font-bold text-foreground/80 hover:bg-muted"><ShieldCheck className="h-4 w-4 text-success" /> Account secure</button>
                      <button onClick={doLogout} className="flex items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm font-bold text-destructive hover:bg-destructive/10"><LogOut className="h-4 w-4" /> Logout</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 pb-24 sm:p-4 lg:p-5 lg:pb-5">
          <MotionPage routeKey={location.pathname + location.search}>
            <Outlet />
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
