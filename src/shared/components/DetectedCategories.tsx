import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { categoriesAPI } from '@/core/api/vnwAPI';
import type { NumberCategoryMatch } from '@/core/categories/types';
import { cn } from '@/core/lib/utils';

interface DetectedCategoriesProps {
  number: string;
  className?: string;
}

export default function DetectedCategories({ number, className }: DetectedCategoriesProps) {
  const [matches, setMatches] = useState<NumberCategoryMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const digitCount = String(number || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').length;

  useEffect(() => {
    let active = true;
    setError('');
    if (digitCount !== 10) {
      setMatches([]);
      setLoading(false);
      return () => { active = false; };
    }

    setMatches([]);
    setLoading(true);
    const timer = window.setTimeout(() => {
      categoriesAPI.classify(number)
        .then((result) => {
          if (!active) return;
          setMatches(result.categories || []);
        })
        .catch((reason: Error) => {
          if (!active) return;
          setMatches([]);
          setError(reason.message || 'Unable to detect category.');
        })
        .finally(() => { if (active) setLoading(false); });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [number, digitCount]);

  return (
    <div className={cn('rounded-lg border border-primary/20 bg-primary/5 px-3 py-3', className)} aria-live="polite">
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        Matching categories
        {loading && <span className="text-muted-foreground">Checking...</span>}
      </div>
      {digitCount !== 10 ? (
        <p className="mt-1.5 text-xs text-muted-foreground">Enter a valid 10-digit mobile number to see its matching categories and subcategories.</p>
      ) : error ? (
        <p className="mt-1.5 text-xs text-destructive">{error}</p>
      ) : !loading && matches.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {matches.map((match) => <span key={match.slug} className="rounded-full border border-primary/20 bg-background px-2 py-1 text-[11px] font-semibold text-foreground" title={match.subcategories?.map((item) => item.name).join(', ')}>
            {match.name}{match.subcategories?.length ? ` · ${match.subcategories.map((item) => item.name).join(', ')}` : ''}
          </span>)}
        </div>
      ) : !loading && digitCount === 10 ? <p className="mt-1.5 text-xs text-muted-foreground">No matching pattern found.</p> : null}
    </div>
  );
}
