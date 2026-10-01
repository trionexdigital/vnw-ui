import { useEffect, useState } from 'react';
import { cn } from '@/core/lib/utils';
import type { User } from '@/app/authSlice';

export default function UserAvatar({ user, className }: { user: Partial<User> | null; className?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [user?.logo]);
  const name = user?.name || user?.full_name || 'User';
  return <span className={cn('grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary text-xs font-black text-primary-foreground', className)}>
    {user?.logo && !failed ? <img src={user.logo} alt={`${name} profile`} onError={() => setFailed(true)} className="h-full w-full object-cover" /> : name.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase()}
  </span>;
}
