import { FormEvent, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Grid3X3, Search, Heart, User, Sparkles, X } from 'lucide-react';
import { useStore } from '@/shared/store/useStore';
import { localService } from '@/core/services/local';
import { cn } from '@/core/lib/utils';

export default function BottomNav() {
  const navigate = useNavigate();
  const { wishlistCount } = useStore();
  const authed = !!localService.getToken();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [aiMode, setAiMode] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    setSearchOpen(false);
    if (!q) return navigate('/shop');
    navigate(aiMode ? `/shop?ai=${encodeURIComponent(q)}` : `/shop?q=${encodeURIComponent(q)}`);
  };

  const items = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/shop', label: 'Category', icon: Grid3X3 },
    { to: '/shop', label: 'Search', icon: Search, action: () => setSearchOpen(true), center: true },
    { to: '/wishlist', label: 'Wishlist', icon: Heart, badge: wishlistCount },
    { to: authed ? '/account' : '/login', label: 'Account', icon: User },
  ];

  return (
    <>
      {searchOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-[#1d1830]/35 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
          <form onSubmit={submit} className="glass-panel absolute inset-x-3 bottom-20 rounded-[1.5rem] p-4 animate-rise-in">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-base font-black text-[#1d1830]">Search VIP Numbers</div>
                <div className="text-xs text-muted-foreground">Find by number, pattern, numerology, or AI</div>
              </div>
              <button type="button" onClick={() => setSearchOpen(false)} className="grid h-10 w-10 place-items-center rounded-2xl bg-white/70"><X className="h-5 w-5" /></button>
            </div>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setAiMode(false)} className={cn('rounded-2xl px-3 py-2 text-sm font-black', !aiMode ? 'bg-white text-[#7c2cff] shadow-sm' : 'bg-white/35 text-muted-foreground')}>Normal Search</button>
              <button type="button" onClick={() => setAiMode(true)} className={cn('rounded-2xl px-3 py-2 text-sm font-black', aiMode ? 'bg-white text-[#7c2cff] shadow-sm' : 'bg-white/35 text-muted-foreground')}><Sparkles className="mr-1 inline h-4 w-4" />AI Search</button>
            </div>
            <div className="flex gap-2">
              <input value={query} onChange={(e) => setQuery(e.target.value)} autoFocus placeholder={aiMode ? 'e.g. lucky number under 50000' : 'e.g. 9999, 786, 9193'} className="input-luxury min-w-0 flex-1" />
              <button className="btn-royal shrink-0 px-4">Go</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {['9999', '7777', 'sum 9', 'business under 50000'].map((p) => (
                <button key={p} type="button" onClick={() => setQuery(p)} className="rounded-2xl bg-white/60 px-3 py-1.5 text-xs font-bold text-[#1d1830]/75">{p}</button>
              ))}
            </div>
          </form>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/70 bg-white/78 shadow-[0_-18px_50px_-34px_rgba(93,44,159,.55)] backdrop-blur-2xl lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="mx-auto grid max-w-md grid-cols-5 px-1">
          {items.map((it, i) => (
            <NavLink key={i} to={it.to} end={it.end}
              onClick={(e) => { if (it.action) { e.preventDefault(); it.action(); } }}
              className={({ isActive }) => cn(
                'relative flex flex-col items-center gap-1 py-2 text-[10px] font-bold transition-colors',
                isActive && !it.action ? 'text-[#7c2cff]' : 'text-muted-foreground')}>
              {({ isActive }) => (
                <>
                  <span className={cn(
                    'relative grid place-items-center rounded-2xl transition',
                    it.center ? '-mt-5 h-14 w-14 bg-gradient-to-br from-[#6c27ee] to-[#d923c6] text-white shadow-xl shadow-fuchsia-500/25' : 'h-8 w-8',
                    isActive && !it.action && !it.center && 'scale-110 bg-white/70 shadow-sm'
                  )}>
                    <it.icon className={it.center ? 'h-7 w-7' : 'h-5 w-5'} />
                    {it.badge ? <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-gradient-to-br from-[#ff8a21] to-[#d923c6] px-1 text-[9px] font-bold text-white">{it.badge}</span> : null}
                  </span>
                  <span className={it.center ? '-mt-0.5 text-[#7c2cff]' : ''}>{it.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
