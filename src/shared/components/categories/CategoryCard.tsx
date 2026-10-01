import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Fingerprint, Hash, Layers3, ListOrdered, Repeat2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { NumberCategory } from '@/core/categories/types';
import { getCategoryCount } from '@/core/categories/types';
import { cn } from '@/core/lib/utils';

const CATEGORY_PRESENTATION: Record<string, { sample: string; Icon: LucideIcon }> = {
  'numerology-numbers': { sample: 'Find your matching sum', Icon: Fingerprint },
  'penta-vip-mobile-no': { sample: 'Five repeating digits', Icon: Layers3 },
  'doublling-aabbcc': { sample: 'AA · BB · CC', Icon: Layers3 },
  'vip-mobile-number': { sample: 'XY · XY · XY', Icon: Repeat2 },
  'customer-care-numbers': { sample: 'Mirror patterns', Icon: Repeat2 },
  'semi-mirror-vip-mobile-number': { sample: 'Semi-mirror patterns', Icon: Repeat2 },
  'choice-mobile-number': { sample: 'Four repeating digits', Icon: Layers3 },
  'unforgettable-vip-number': { sample: 'XXX · YYY', Icon: Layers3 },
  'xyzxyz-fancy-number': { sample: 'XYZ · XYZ', Icon: Repeat2 },
  'buy-vip-mobile-number-online': { sample: 'Six repeating digits', Icon: Layers3 },
  'vip-number-india': { sample: 'ABAB · XYXY', Icon: Repeat2 },
  'abcd-abcd-fancy-number': { sample: 'ABCD · ABCD', Icon: Repeat2 },
  'ascending-descending-fancy-number': { sample: 'Counting patterns', Icon: ListOrdered },
  '2-digit-mobile-numbers': { sample: 'Minimum digit patterns', Icon: Hash },
  'septa-octa-vip-number-for-sale': { sample: 'Seven or eight repeating digits', Icon: Layers3 },
  '786-vip-mobile-numbers': { sample: '… 786 …', Icon: Fingerprint },
  'vip-number-000': { sample: '… 000 …', Icon: Hash },
  'golden-mobile-number': { sample: 'Memorable fancy numbers', Icon: Sparkles },
};

function categoryExample(category: NumberCategory): string {
  const example = category.examples?.find((value) => String(value || '').trim());
  return example || CATEGORY_PRESENTATION[category.slug]?.sample || category.subcategories?.[0]?.name || 'VIP pattern';
}

export interface CategoryCardProps {
  category: NumberCategory;
  compact?: boolean;
  className?: string;
}

export function CategoryCard({ category, compact = false, className }: CategoryCardProps) {
  const count = getCategoryCount(category);
  const presentation = CATEGORY_PRESENTATION[category.slug];
  const Icon = presentation?.Icon || Sparkles;

  return (
    <div
      data-category-card={category.slug}
      aria-label={`${category.name}${count ? `, ${count} numbers available` : ''}`}
      className={cn(
        'group relative flex h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        compact ? 'min-h-[154px] flex-col p-4' : 'min-h-[196px] flex-col p-5',
        className,
      )}
    >
      <span className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl transition group-hover:bg-primary/20" />
      <div className="relative flex items-start justify-between gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[10px] font-black text-muted-foreground">
          {count ? `${count.toLocaleString('en-IN')} available` : 'Explore pattern'}
        </span>
      </div>

      <div className="relative mt-4 flex-1">
        <h3 className="text-base font-black leading-tight text-foreground"><Link className="hover:text-primary focus-visible:underline" to={`/shop?category=${encodeURIComponent(category.slug)}`}>{category.name}</Link></h3>
        <p className="mt-1.5 font-mono text-[11px] font-bold tracking-wide text-primary">{categoryExample(category)}</p>
        {!compact && category.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{category.description}</p>
        )}
      </div>

      {!compact && Boolean(category.subcategories?.length) && (
        <div className="relative mt-3 flex max-h-32 flex-wrap gap-1.5 overflow-y-auto" aria-label={`${category.name} subcategories`}>
          {category.subcategories!.map((sub) => (
            <Link
              key={`${category.id}:${sub.id}`}
              to={`/shop?category=${encodeURIComponent(category.slug)}&subcategory_id=${sub.id}`}
              className="rounded-full border border-primary/20 bg-primary/5 px-2 py-1 text-[11px] font-semibold text-foreground hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {sub.name} <span className="text-muted-foreground">{Number(sub.number_count || 0).toLocaleString('en-IN')}</span>
            </Link>
          ))}
        </div>
      )}

      <Link to={`/shop?category=${encodeURIComponent(category.slug)}`} className="relative mt-3 inline-flex items-center gap-1.5 text-xs font-black text-primary">
        View numbers
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </Link>
    </div>
  );
}

export function CategoryGrid({
  categories,
  compact = false,
  className,
}: {
  categories: NumberCategory[];
  compact?: boolean;
  className?: string;
}) {
  return (
    <div data-category-grid className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {categories.map((category) => (
        <CategoryCard key={category.slug} category={category} compact={compact} />
      ))}
    </div>
  );
}
