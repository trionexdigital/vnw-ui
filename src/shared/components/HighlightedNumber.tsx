import type { NumberCategoryMatch } from '@/core/categories/types';
import { buildHighlightedNumberModel, createNumberAriaLabel } from '@/core/categories/highlight';
import { cn } from '@/core/lib/utils';

interface HighlightedNumberProps {
  number: string | number;
  category?: NumberCategoryMatch | null;
  className?: string;
}

export default function HighlightedNumber({ number, category, className }: HighlightedNumberProps) {
  const model = buildHighlightedNumberModel(number, category?.match_spans);

  return (
    <span
      role="img"
      aria-label={createNumberAriaLabel(model, category?.name)}
      className={cn(
        'inline-flex w-full min-w-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 px-1.5 py-2 shadow-sm',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex min-w-0 flex-nowrap items-center justify-center gap-[clamp(0.12rem,0.8vw,0.32rem)] whitespace-nowrap text-[clamp(1.05rem,5.4vw,1.5rem)] font-black leading-none tabular-nums tracking-[0.045em] text-foreground"
      >
        {model.segments.map((segment, index) => (
          <span
            key={`${segment.start}-${segment.end}-${index}`}
            data-match={segment.matched ? 'true' : 'false'}
            className={cn(
              'inline-flex min-h-[1.55em] items-center justify-center rounded-md border border-transparent px-[0.08em]',
              segment.matched && 'border-primary bg-primary px-[0.2em] text-primary-foreground shadow-sm ring-1 ring-primary/25',
            )}
          >
            {segment.text}
          </span>
        ))}
      </span>
    </span>
  );
}
