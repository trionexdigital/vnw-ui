import { cn } from '@/core/lib/utils';

export const BRAND_LOGO_SRC = '/logo/logo.png';
export const BRAND_SLOGAN_SRC = '/logo/slogan.png';

/**
 * The official VIP Number World logo. Use this everywhere the brand mark is
 * shown (headers, auth, hero, etc.) instead of a placeholder icon. Pass sizing
 * via `className` (e.g. "h-10 w-10").
 */
export function Logo({ className, alt = 'VIP Number World' }: { className?: string; alt?: string }) {
  return <img src={BRAND_LOGO_SRC} alt={alt} className={cn('object-contain', className)} />;
}

export function Slogan({ className, alt = 'VIP Number World - Premium Numbers. Premium Identity.' }: { className?: string; alt?: string }) {
  return <img src={BRAND_SLOGAN_SRC} alt={alt} className={cn('object-contain', className)} />;
}

export function BrandLockup({
  className,
  logoClassName,
  sloganClassName,
}: {
  className?: string;
  logoClassName?: string;
  sloganClassName?: string;
}) {
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2', className)}>
      <Logo className={cn('h-10 w-10 shrink-0', logoClassName)} />
      <Slogan className={cn('h-10 w-40 min-w-0', sloganClassName)} />
    </span>
  );
}

export default Logo;
