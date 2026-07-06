import { cn } from '@/core/lib/utils';
import logoUrl from '@/assets/images/favicon.png';

/**
 * The official VIP Number World logo. Use this everywhere the brand mark is
 * shown (headers, auth, hero, etc.) instead of a placeholder icon. Pass sizing
 * via `className` (e.g. "h-10 w-10").
 */
export function Logo({ className, alt = 'VIP Number World' }: { className?: string; alt?: string }) {
  return <img src={logoUrl} alt={alt} className={cn('object-contain', className)} />;
}

export default Logo;
