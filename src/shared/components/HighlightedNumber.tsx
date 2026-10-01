import type { NumberCategoryMatch } from '@/core/categories/types';
import { buildHighlightedNumberModel, createNumberAriaLabel } from '@/core/categories/highlight';
import { numberDisplayGroups } from '@/core/categories/numberDisplay';
import { cn } from '@/core/lib/utils';

interface HighlightedNumberProps {
  number: string | number;
  category?: NumberCategoryMatch | null;
  className?: string;
  appearance?: 'default' | 'reference';
}

export default function HighlightedNumber({ number, category, className, appearance = 'default' }: HighlightedNumberProps) {
  const model = buildHighlightedNumberModel(number, category?.match_spans);
  const reference = appearance === 'reference';
  let offset = 0;
  const segments = model.hasHighlights || !category ? model.segments : numberDisplayGroups(model.canonicalNumber, category).map((text) => {
    const segment = { start: offset, end: offset + text.length, text, matched: false };
    offset = segment.end;
    return segment;
  });

  return (
    <span
      role="img"
      aria-label={createNumberAriaLabel(model, category?.name)}
      className={cn(
        reference ? 'reference-card__number' : 'inline-flex w-full min-w-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 px-1.5 py-2 shadow-sm',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={reference ? 'reference-card__digits' : 'vnw-card-numeral flex min-w-0 flex-nowrap items-center justify-center gap-[clamp(0.12rem,0.8vw,0.32rem)] whitespace-nowrap text-[clamp(1.05rem,5.4vw,1.5rem)] leading-none tracking-[0.045em] text-foreground'}
      >
        {segments.map((segment, index) => (
          <span
            key={`${segment.start}-${segment.end}-${index}`}
            data-match={segment.matched ? 'true' : 'false'}
            className={cn(
              reference ? 'reference-card__digit-group' : 'inline-flex min-h-[1.55em] items-center justify-center rounded-md border border-transparent px-[0.08em]',
              !reference && segment.matched && 'border-primary bg-primary px-[0.2em] text-primary-foreground shadow-sm ring-1 ring-primary/25',
            )}
          >
            {reference
              ? Array.from(segment.text).map((digit, digitIndex) => (
                <span key={`${segment.start}-${digitIndex}`} className="reference-card__digit" style={{ '--digit-index': segment.start + digitIndex } as React.CSSProperties}>{digit}</span>
              ))
              : segment.text}
          </span>
        ))}
      </span>
    </span>
  );
}
