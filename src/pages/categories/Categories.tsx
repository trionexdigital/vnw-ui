import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, RefreshCw, Search, Shapes, Sparkles } from 'lucide-react';
import { categoriesAPI } from '@/core/api/vnwAPI';
import type { NumberCategory } from '@/core/categories/types';
import { getCategoryCount } from '@/core/categories/types';
import { CategoryGrid } from '@/shared/components/categories/CategoryCard';

function CategoryGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Loading categories" aria-busy="true">
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="min-h-[196px] animate-pulse rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex justify-between gap-3">
            <span className="h-10 w-10 rounded-xl bg-muted" />
            <span className="h-7 w-24 rounded-full bg-muted" />
          </div>
          <div className="mt-5 h-5 w-2/3 rounded bg-muted" />
          <div className="mt-3 h-3 w-1/2 rounded bg-muted" />
          <div className="mt-4 h-3 w-full rounded bg-muted" />
          <div className="mt-2 h-3 w-4/5 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export default function Categories() {
  const [categories, setCategories] = useState<NumberCategory[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await categoriesAPI.list();
      setCategories(Array.isArray(response) ? response.filter((category) => category?.slug && category?.name) : []);
    } catch (requestError: any) {
      setCategories([]);
      setError(requestError?.message || 'Categories could not be loaded right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadCategories(); }, [loadCategories]);

  const visibleCategories = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((category) => [
      category.name,
      category.description,
      ...(category.examples || []),
      ...(category.aliases || []),
    ].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [categories, query]);

  const availableNumbers = useMemo(
    () => categories.reduce((total, category) => total + getCategoryCount(category), 0),
    [categories],
  );

  return (
    <main data-categories-page className="bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border bg-card px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,hsl(var(--primary)/0.13),transparent_34%),radial-gradient(circle_at_82%_70%,hsl(var(--accent)/0.25),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Automatic pattern matching
            </span>
            <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Find a VIP number by <span className="text-primary">category</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Every number is analysed automatically and assigned to its strongest matching pattern. Choose a category to see its available collection.
            </p>
            {!loading && !error && (
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-muted-foreground">
                <span className="rounded-full border border-border bg-background px-3 py-1.5">{categories.length} categories</span>
                <span className="rounded-full border border-border bg-background px-3 py-1.5">{availableNumbers.toLocaleString('en-IN')} assigned numbers</span>
              </div>
            )}
          </div>

          <label className="relative block">
            <span className="sr-only">Search categories</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Mirror, 786, Counting…"
              className="h-12 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm font-bold text-foreground shadow-sm outline-none transition placeholder:font-medium placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-ring/15"
            />
          </label>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {loading ? <CategoryGridSkeleton /> : error ? (
            <div className="rounded-2xl border border-border bg-card px-5 py-14 text-center shadow-sm">
              <Shapes className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
              <h2 className="mt-3 text-xl font-black">We could not load the categories</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{error}</p>
              <button onClick={() => void loadCategories()} className="btn-royal mt-5">
                <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
              </button>
            </div>
          ) : visibleCategories.length ? (
            <CategoryGrid categories={visibleCategories} />
          ) : (
            <div className="rounded-2xl border border-border bg-card px-5 py-14 text-center shadow-sm">
              <Search className="mx-auto h-9 w-9 text-primary" aria-hidden="true" />
              <h2 className="mt-3 text-lg font-black">No category matches “{query}”</h2>
              <p className="mt-2 text-sm text-muted-foreground">Clear the search to explore all automatic categories.</p>
              <button onClick={() => setQuery('')} className="btn-gold-outline mt-5">Clear search</button>
            </div>
          )}

          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/10 p-5 sm:flex-row">
            <div>
              <h2 className="font-black text-foreground">Not sure which pattern to choose?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Browse all available VIP numbers and refine your search at any time.</p>
            </div>
            <Link to="/shop" className="btn-royal w-full shrink-0 sm:w-auto">
              Browse all numbers <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
