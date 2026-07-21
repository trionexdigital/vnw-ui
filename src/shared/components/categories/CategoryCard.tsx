import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Ban, Fingerprint, Hash, Layers3, ListOrdered, Repeat2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { NumberCategory } from '@/core/categories/types';
import { getCategoryCount } from '@/core/categories/types';
import { cn } from '@/core/lib/utils';

const CATEGORY_PRESENTATION: Record<string, { sample: string; Icon: LucideIcon }> = {
  'without-248-numbers': { sample: 'No 2 · 4 · 8', Icon: Ban },
  'mirror-numbers': { sample: 'ABCDE · ABCDE', Icon: Repeat2 },
  'semi-mirror-numbers': { sample: 'ABCD · ABCD', Icon: Repeat2 },
  'two-digit-numbers': { sample: 'Only A & B', Icon: Hash },
  'three-digit-numbers': { sample: 'Only A, B & C', Icon: Hash },
  'counting-numbers': { sample: '5 · 6 · 7 · 8', Icon: ListOrdered },
  '786-numbers': { sample: '… 786 …', Icon: Fingerprint },
  '108-numbers': { sample: '… 108 …', Icon: Fingerprint },
  'doubling-numbers': { sample: 'AA · BB · CC', Icon: Layers3 },
  'ab-ab-xy-xy-numbers': { sample: 'AB · AB · XY · XY', Icon: Repeat2 },
  'ab-ab-ab-numbers': { sample: 'AB · AB · AB', Icon: Repeat2 },
  'start-ab-ab-numbers': { sample: 'ABAB · …', Icon: Repeat2 },
  'middle-ab-ab-numbers': { sample: '… · ABAB · …', Icon: Repeat2 },
  'ending-ab-ab-numbers': { sample: '… · ABAB', Icon: Repeat2 },
  'abc-abc-abc-numbers': { sample: 'ABC · ABC · ABC', Icon: Repeat2 },
  'abc-abc-numbers': { sample: 'ABC · ABC', Icon: Repeat2 },
  'aaa-bbb-numbers': { sample: 'AAA · BBB', Icon: Layers3 },
  'triple-numbers': { sample: 'AAA', Icon: Layers3 },
  'tetra-numbers': { sample: 'AAAA', Icon: Layers3 },
  'penta-numbers': { sample: 'AAAAA', Icon: Layers3 },
  'hexa-numbers': { sample: 'AAAAAA', Icon: Layers3 },
  'septa-numbers': { sample: 'AAAAAAA', Icon: Layers3 },
  'octa-numbers': { sample: 'AAAAAAAA', Icon: Layers3 },
  'unique-numbers': { sample: 'One of a kind', Icon: Sparkles },
};

function categoryExample(category: NumberCategory): string {
  const example = category.examples?.find((value) => String(value || '').trim());
  return example || CATEGORY_PRESENTATION[category.slug]?.sample || 'VIP pattern';
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
    <Link
      data-category-card={category.slug}
      to={`/shop?category=${encodeURIComponent(category.slug)}`}
      aria-label={`Browse ${category.name}${count ? `, ${count} numbers available` : ''}`}
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
        <h3 className="text-base font-black leading-tight text-foreground">{category.name}</h3>
        <p className="mt-1.5 font-mono text-[11px] font-bold tracking-wide text-primary">{categoryExample(category)}</p>
        {!compact && category.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{category.description}</p>
        )}
      </div>

      <span className="relative mt-3 inline-flex items-center gap-1.5 text-xs font-black text-primary">
        View numbers
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </span>
    </Link>
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
