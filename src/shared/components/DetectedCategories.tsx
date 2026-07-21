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
  const [match, setMatch] = useState<NumberCategoryMatch | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const digitCount = String(number || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').length;

  useEffect(() => {
    let active = true;
    setError('');
    if (digitCount !== 10) {
      setMatch(null);
      setLoading(false);
      return () => { active = false; };
    }

    setMatch(null);
    setLoading(true);
    const timer = window.setTimeout(() => {
      categoriesAPI.classify(number)
        .then((result) => {
          if (!active) return;
          setMatch(result.primary_category || result.categories?.[0] || null);
        })
        .catch((reason: Error) => {
          if (!active) return;
          setMatch(null);
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
        Detected category
        {loading && <span className="text-muted-foreground">Checking...</span>}
      </div>
      {digitCount !== 10 ? (
        <p className="mt-1.5 text-xs text-muted-foreground">Enter a valid 10-digit mobile number to detect its strongest category automatically.</p>
      ) : error ? (
        <p className="mt-1.5 text-xs text-destructive">{error}</p>
      ) : !loading && match ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-primary/20 bg-background px-2 py-1 text-[11px] font-semibold text-foreground">
            {match.name}
          </span>
        </div>
      ) : null}
    </div>
  );
}
