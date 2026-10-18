import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Building2, CalendarClock, ChevronDown, Heart, House, Hash, LayoutDashboard, LogIn, LogOut, Menu, PhoneCall, ShoppingCart, User, UserPlus, UsersRound, X, GitCompareArrows } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { logout } from '@/app/authSlice';
import { localService } from '@/core/services/local';
import { useStore } from '@/shared/store/useStore';
import { BrandLockup } from '@/shared/components/Logo';
import UserAvatar from '@/shared/components/UserAvatar';
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet';
import { LanguageButton } from '@/shared/language/LanguageProvider';
import HeaderNumberSearch from './HeaderNumberSearch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu';

const primaryNavigation = [
  { label:'Home', to:'/', icon:House }, { label:'Family Pack', to:'/family-pack', icon:UsersRound },
  { label:'Corporate Pack', to:'/corporate-numbers', icon:Building2 }, { label:'Numerology', to:'/numerology', icon:Hash },
];
const secondaryNavigation = [{ label:'How It Works', to:'/how-it-works', icon:BookOpen }, { label:'Contact', to:'/about', icon:PhoneCall }];
const navigation = [...primaryNavigation, ...secondaryNavigation];

const headerButterflies = [
  { left:'5%', top:'62%', wings:['93','39'], delay:'-1.2s', duration:'15.5s' },
  { left:'34%', top:'18%', wings:['78','87'], delay:'-6.4s', duration:'17s' },
  { left:'64%', top:'68%', wings:['7','7'], delay:'-10.1s', duration:'14.8s' },
];

export default function StoreHeader() {
  const location=useLocation(), dispatch=useAppDispatch();
  const user=useAppSelector(s=>s.auth.user), token=localService.getToken();
  const {cartCount,wishlistCount,compare,comparePulse,refreshCounts}=useStore();
  const signedIn=Boolean(token&&user);
  const trigger=useRef<HTMLButtonElement>(null), brand=useRef<HTMLAnchorElement>(null);
  const [open,setOpen]=useState(false), [scrolled,setScrolled]=useState(false);
  const [moreOpen,setMoreOpen]=useState(false), [accountOpen,setAccountOpen]=useState(false);
  const [mobile,setMobile]=useState(()=>typeof window!=='undefined' && !window.matchMedia('(min-width:1200px)').matches);
  const [compareCue,setCompareCue]=useState(false);
  const dash=user?.role==='ADMIN'?'/admin':user?.role==='DEALER'?'/dealer':'/dashboard';

  useEffect(()=>{if(!comparePulse)return;setCompareCue(true);const timer=window.setTimeout(()=>setCompareCue(false),1700);return()=>window.clearTimeout(timer);},[comparePulse]);
  useEffect(()=>{if(token)refreshCounts();},[token,refreshCounts]);
  useEffect(()=>{setOpen(false);setMoreOpen(false);setAccountOpen(false);},[location.pathname]);
  useEffect(()=>{
    const media=window.matchMedia('(min-width:1200px)');
    const update=()=>{setMobile(!media.matches);setOpen(false);setMoreOpen(false);setAccountOpen(false);};
    media.addEventListener('change',update);
    return()=>media.removeEventListener('change',update);
  },[]);
  useEffect(()=>{const update=()=>setScrolled(window.scrollY>16);update();window.addEventListener('scroll',update,{passive:true});return()=>window.removeEventListener('scroll',update);},[]);

  const close=()=>setOpen(false);
  const authLinks=(drawer=false)=><>
    <Link to="/login" onClick={drawer?close:undefined} className="store-header__button store-header__auth-link"><LogIn aria-hidden="true"/><span>Sign In</span></Link>
    <Link to="/register" onClick={drawer?close:undefined} className="store-header__button store-header__auth-link public-header__register text-white"><UserPlus aria-hidden="true"/><span>Register</span></Link>
  </>;
  const accountLinks=[{label:'Dashboard',to:dash,icon:LayoutDashboard},{label:'My Pre-books',to:'/pre-book#mine',icon:CalendarClock},{label:'My Orders',to:'/orders',icon:ShoppingCart},{label:'Profile',to:'/account',icon:User}];
  const shoppingLinks=[{label:'Pre-book VIP Numbers',to:'/pre-book',icon:CalendarClock},{label:'Wishlist',to:'/wishlist',icon:Heart,count:wishlistCount},{label:'Cart',to:'/cart',icon:ShoppingCart,count:cartCount},{label:'Compare Numbers',to:'/compare',icon:GitCompareArrows,count:compare.length}];
  const renderAccountItems=(items:typeof shoppingLinks)=>items.map(item=>{
    const Icon=item.icon;
    return <DropdownMenuItem key={item.to} asChild><Link to={item.to} onClick={()=>setAccountOpen(false)}><Icon aria-hidden="true"/><span>{item.label}</span>{item.count?<span translate="no">({item.count})</span>:null}</Link></DropdownMenuItem>;
  });
  const renderGroup=(label:string,items:typeof shoppingLinks)=><div className="mb-3"><p className="px-2 pb-1 text-[10px] font-black uppercase text-muted-foreground">{label}</p><div className="grid gap-1">{items.map(item=>{const Icon=item.icon;return <Link key={item.to} to={item.to} onClick={close} aria-current={location.pathname===item.to?'page':undefined} className={`store-drawer__link ${location.pathname===item.to?'is-active':''}`}><span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-sidebar-accent text-primary"><Icon className="h-4 w-4"/></span><span className="min-w-0 flex-1">{item.label}</span>{item.count?<span translate="no" className="text-xs">{item.count}</span>:null}</Link>;})}</div></div>;

  return <>
    <header className={`public-header store-header fixed inset-x-0 top-0 z-50 ${scrolled?'is-scrolled':'is-top'}`} data-scrolled={scrolled} data-guest={!signedIn}>
      {compareCue && <span key={comparePulse} role="status" className="sr-only">Added to comparison</span>}
      <div className="public-header__panel store-header__panel">
        <div className="public-header__butterflies pointer-events-none absolute inset-0 z-0" aria-hidden="true" translate="no">
          {headerButterflies.map(butterfly=><span
            key={`${butterfly.left}-${butterfly.top}`}
            className="header-hero-butterfly numeric-butterfly numeric-butterfly--background absolute"
            style={{left:butterfly.left,top:butterfly.top,animationDelay:butterfly.delay,animationDuration:butterfly.duration,'--flutter-delay':butterfly.delay} as CSSProperties}
          >
            <span className="numeric-butterfly__wing numeric-butterfly__wing--left">{butterfly.wings[0]}</span>
            <span className="numeric-butterfly__body"/>
            <span className="numeric-butterfly__wing numeric-butterfly__wing--right">{butterfly.wings[1]}</span>
          </span>)}
        </div>
        <Link ref={brand} to="/" className="store-header__brand" aria-label="VIP Number World"><BrandLockup logoClassName="h-8 w-8 sm:h-10 sm:w-10" sloganClassName="h-7 w-[108px] sm:h-8 sm:w-[132px] xl:w-[132px] 2xl:w-[132px]"/></Link>
        <nav className="store-header__nav" aria-label="Primary navigation" data-primary-navigation>
          {primaryNavigation.map(item=>{const Icon=item.icon;return <Link key={item.to} to={item.to} aria-current={location.pathname===item.to?'page':undefined} className={location.pathname===item.to?'is-active':''}><Icon aria-hidden="true"/><span>{item.label}</span></Link>;})}
          <DropdownMenu open={moreOpen} onOpenChange={setMoreOpen}>
            <DropdownMenuTrigger asChild><button type="button" className="store-header__more" data-store-more><span>More</span><ChevronDown className="store-header__chevron" aria-hidden="true"/></button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="store-header__submenu z-[90]">
              {secondaryNavigation.map(item=><DropdownMenuItem key={item.to} asChild><Link to={item.to} onClick={()=>setMoreOpen(false)} aria-current={location.pathname===item.to?'page':undefined}>{item.label}</Link></DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        <div className="public-header__desktop-search store-header__search"><HeaderNumberSearch/></div>
        <div className="store-header__actions">
          {!signedIn && <div className="store-header__auth">{authLinks()}</div>}
          <div className="store-header__language"><LanguageButton compact iconOnly/></div>
          <Link to="/compare" aria-label="Compare numbers" title="Compare numbers" className={`store-header__button store-header__icon ${compareCue?'comparison-cue':''}`}><GitCompareArrows aria-hidden="true"/>{compare.length?<span translate="no" className="store-header__count">{compare.length}</span>:null}</Link>
          {signedIn && <div className="store-header__desktop-account">
            <DropdownMenu open={accountOpen} onOpenChange={setAccountOpen}>
              <DropdownMenuTrigger asChild><button type="button" className="store-header__button store-header__icon" aria-label="Account" title="Account" data-store-account><User aria-hidden="true"/></button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="store-header__submenu z-[90]">
                <DropdownMenuLabel>Account</DropdownMenuLabel>{renderAccountItems(accountLinks)}
                <DropdownMenuSeparator/><DropdownMenuLabel>Your numbers</DropdownMenuLabel>{renderAccountItems(shoppingLinks)}
                <DropdownMenuSeparator/><DropdownMenuItem onSelect={()=>{dispatch(logout());setAccountOpen(false);}}><LogOut aria-hidden="true"/>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>}
          <button type="button" ref={trigger} onClick={()=>setOpen(true)} aria-label="Open navigation menu" title="Menu" aria-expanded={open} className="public-header__mobile-menu store-header__button store-header__icon store-header__menu"><Menu aria-hidden="true"/></button>
        </div>
      </div>
    </header>
    {mobile && <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" onCloseAutoFocus={event=>{event.preventDefault();(trigger.current?.offsetWidth?trigger.current:brand.current)?.focus({preventScroll:true});}} aria-describedby={undefined} className="public-header__drawer store-drawer z-[100] h-[100dvh] w-[min(320px,88vw)] overflow-hidden rounded-l-[1.6rem] border-0 bg-sidebar p-0 [&>button:last-child]:hidden">
        <SheetTitle className="sr-only">Store navigation</SheetTitle>
        <div className="flex h-full flex-col overflow-hidden rounded-l-[1.6rem] border-l border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm">
          <div className="store-drawer__header grid shrink-0 items-center gap-2 border-b border-sidebar-border p-3">
            <Link to="/" onClick={close} aria-label="VIP Number World" className="store-drawer__brand min-w-0"><BrandLockup logoClassName="h-9 w-9 sm:h-9 sm:w-9" sloganClassName="h-8 w-[132px] sm:h-8 sm:w-[132px] xl:w-[132px] 2xl:w-[132px]"/></Link>
            <LanguageButton compact iconOnly/>
            <button type="button" onClick={close} aria-label="Close navigation menu" data-store-drawer-close className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sidebar-accent"><X className="h-5 w-5"/></button>
          </div>
          <nav className="store-drawer__scroll min-h-0 flex-1 overflow-y-auto overscroll-contain py-3" aria-label="Store menu">
            {renderGroup('Store',navigation)}{renderGroup('Your numbers',shoppingLinks)}
            {signedIn && renderGroup('Account',accountLinks)}
          </nav>
          {!signedIn && <div className="store-drawer__footer store-drawer__auth shrink-0 border-t border-sidebar-border">{authLinks(true)}</div>}
          {signedIn && <div className="store-drawer__footer shrink-0 space-y-1 border-t border-sidebar-border">
            <Link to="/account" onClick={close} className="flex items-center gap-3 rounded-2xl border border-sidebar-border bg-sidebar-accent p-2 shadow-sm"><UserAvatar user={user!} className="h-8 w-8"/><span translate="no" className="min-w-0"><span className="block truncate text-sm font-black">{user?.name}</span><span className="block truncate text-xs text-muted-foreground">{user?.email||user?.phone}</span></span></Link>
            <button type="button" onClick={()=>{dispatch(logout());close();}} className="flex min-h-9 w-full items-center gap-2 rounded-2xl bg-sidebar-accent px-2 text-sm font-bold text-destructive"><LogOut className="h-4 w-4"/>Logout</button>
          </div>}
        </div>
      </SheetContent>
    </Sheet>}
  </>;
}
