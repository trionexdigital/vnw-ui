import type { User } from '@/app/authSlice';

export const PERMISSION_ALL = '*';

/** The landing route for a given role after login / when access is denied. */
export function roleHome(role?: string): string {
  const r = (role || 'USER').toUpperCase();
  if (r === 'ADMIN') return '/admin';
  if (r === 'EMPLOYEE') return '/employee';
  if (r === 'DEALER') return '/dealer';
  return '/dashboard';
}

/** True if the user holds the given permission key (ADMIN/EMPLOYEE hold all). */
export function hasPermission(user: User | null | undefined, key: string): boolean {
  const perms = user?.permissions || [];
  if (perms.includes(PERMISSION_ALL)) return true;
  const role = (user?.role || '').toUpperCase();
  if (role === 'ADMIN') return true;
  return perms.includes(key);
}
