import { NavLink } from 'react-router-dom';
import { Grid3X3, Heart, Home, Search, User } from 'lucide-react';
import { useStore } from '@/shared/store/useStore';
import { localService } from '@/core/services/local';
import { cn } from '@/core/lib/utils';

export default function BottomNav() {
  const { wishlistCount } = useStore();
  const authed = Boolean(localService.getToken());
  const items = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/categories', label: 'Category', icon: Grid3X3 },
    { to: '/shop?focus=search', label: 'Search', icon: Search, center: true },
    { to: '/wishlist', label: 'Wishlist', icon: Heart, badge: wishlistCount },
    { to: authed ? '/account' : '/login', label: 'Account', icon: User },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/90 shadow-lg backdrop-blur-2xl lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Mobile navigation"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 px-1">
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            className={({ isActive }) => cn(
              'relative flex min-h-14 flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-bold transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {({ isActive }) => (
              <>
                <span className={cn(
                  'relative grid place-items-center rounded-lg transition',
                  item.center ? 'h-8 w-8 bg-primary text-primary-foreground shadow-sm' : 'h-8 w-8',
                  isActive && !item.center && 'scale-110 bg-card/70 shadow-sm',
                )}>
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  {item.badge ? (
                    <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                      {item.badge}
                    </span>
                  ) : null}
                </span>
                <span className={item.center ? 'text-primary' : ''}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
