import { getPrimaryCategory } from '@/core/categories/types';
import { formatNumberDisplay } from '@/core/categories/numberDisplay';
import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { categoriesAPI, numbersAPI, type NumberCatalogItem } from '@/core/api/vnwAPI';
import type { NumberCategory } from '@/core/categories/types';
import { formatINR } from '@/core/lib/format';
import './HeaderNumberSearch.css';
import { contentQueryKey } from '@/shared/language/searchParams';

const PAGE_SIZE = 10;
type SearchTarget = { category?: string; subcategory_id?: number; q?: string };

function targetFor(query: string, categories: NumberCategory[]): SearchTarget | null {
  const value = query.trim();
  if (!value) return {};
  const digits = value.replace(/[\s-]/g, '');
  if (/^\d{1,10}$/.test(digits)) return { q: digits };
  const numericPart = value.match(/\d[\d\s-]*\d|\d/)?.[0];
  const numberQuery = numericPart?.replace(/\D/g, '');
  const text = (numericPart ? value.replace(numericPart, '') : value).trim().toLowerCase();
  if (!text) return numberQuery && numberQuery.length <= 10 ? { q: numberQuery } : null;
  const exact = categories.find((category) => category.name.toLowerCase() === text);
  if (exact) return { category: exact.slug, ...(numberQuery && numberQuery.length <= 10 ? { q: numberQuery } : {}) };
  for (const category of categories) {
    const sub = category.subcategories?.find((item) => item.name.toLowerCase() === text);
    if (sub) return { category: category.slug, subcategory_id: sub.id, ...(numberQuery && numberQuery.length <= 10 ? { q: numberQuery } : {}) };
  }
  const partial = categories.find((category) => category.name.toLowerCase().includes(text));
  return partial ? { category: partial.slug, ...(numberQuery && numberQuery.length <= 10 ? { q: numberQuery } : {}) }
    : numberQuery && numberQuery.length <= 10 ? { q: numberQuery } : null;
}

function allPath(query: string, target: SearchTarget | null) {
  if (target?.q) {
    const params = new URLSearchParams({ mode: 'global', global_scope: 'anywhere', q: target.q });
    if (target.category) params.set('category', target.category);
    if (target.subcategory_id) params.set('subcategory_id', String(target.subcategory_id));
    return `/shop?${params}`;
  }
  if (target?.category) {
    const params = new URLSearchParams({ category: target.category });
    if (target.subcategory_id) params.set('subcategory_id', String(target.subcategory_id));
    return `/shop?${params}`;
  }
  return query.trim() ? `/shop?mode=ai&ai=${encodeURIComponent(query.trim())}` : '/shop';
}

export default function HeaderNumberSearch() {
  const resultsId = useId();
  const navigate = useNavigate();
  const location = useLocation();
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<NumberCategory[]>([]);
  const [items, setItems] = useState<NumberCatalogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [moreLoading, setMoreLoading] = useState(false);
  const [error, setError] = useState('');
  const requestVersion = useRef(0);
  const target = targetFor(query, categories);
  const viewAll = allPath(query, target);

  useEffect(() => { categoriesAPI.list().then(setCategories).catch(() => undefined); }, []);
  const queryKey=contentQueryKey(new URLSearchParams(location.search));
  useEffect(() => { setOpen(false); }, [location.pathname, queryKey]);
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);
  useEffect(() => {
    if (!open) return;
    const version = ++requestVersion.current;
    setItems([]); setTotal(0); setPage(1); setMoreLoading(false); setError('');
    if (!target) { setLoading(false); return; }
    setLoading(true);
    const timer = window.setTimeout(() => {
      numbersAPI.list({ ...target, page: 1, limit: PAGE_SIZE, sort: query.trim() ? 'popular' : 'newest' })
        .then((data) => {
          if (requestVersion.current !== version) return;
          setItems(data.items || []); setTotal(Number(data.total || 0));
        })
        .catch(() => { if (requestVersion.current === version) setError('Search is unavailable. Please try the full search.'); })
        .finally(() => { if (requestVersion.current === version) setLoading(false); });
    }, query.trim() ? 260 : 0);
    return () => { window.clearTimeout(timer); requestVersion.current += 1; };
  }, [open, query, categories]);

  const loadMore = () => {
    if (moreLoading || !target || items.length >= total) return;
    const version = requestVersion.current;
    setMoreLoading(true);
    numbersAPI.list({ ...target, page: page + 1, limit: PAGE_SIZE, sort: query.trim() ? 'popular' : 'newest' })
      .then((data) => {
        if (requestVersion.current !== version) return;
        setItems((current) => {
          const seen = new Set(current.map((item) => item.number_id));
          return [...current, ...(data.items || []).filter((item: NumberCatalogItem) => !seen.has(item.number_id))];
        });
        setPage((current) => current + 1);
        setTotal(Number(data.total || 0));
      })
      .catch(() => { if (requestVersion.current === version) setError('Could not load more numbers.'); })
      .finally(() => { if (requestVersion.current === version) setMoreLoading(false); });
  };

  return <div ref={root} className="header-number-search">
    <form className="header-number-search__form" role="search" onSubmit={(event) => { event.preventDefault(); setOpen(false); navigate(viewAll); }}>
      <input ref={input} value={query} onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)} onKeyDown={(event) => { if (event.key === 'Escape') { setOpen(false); input.current?.blur(); } }}
        aria-label="Search all VIP numbers" aria-expanded={open} aria-controls={resultsId}
        placeholder="Search any number" autoComplete="off" />
      {query && <button type="button" className="header-number-search__clear" aria-label="Clear search" onClick={() => { setQuery(''); input.current?.focus(); }}>Clear</button>}
      <button type="submit" className="header-number-search__submit" aria-label="View search results">Search</button>
    </form>
    {open && <div id={resultsId} className="header-number-search__panel" role="region" aria-label="Instant VIP number results">
      <div className="header-number-search__heading"><strong>{query.trim() ? 'Matching numbers' : 'Recently added'}</strong><span>{loading ? 'Searching…' : total ? total.toLocaleString('en-IN') : ''}</span></div>
      {loading ? <p className="header-number-search__message" role="status">Finding available numbers…</p>
        : error ? <p className="header-number-search__message" role="alert">{error}</p>
          : !target ? <p className="header-number-search__message">Search digits, or enter a category such as Mirror or Penta. Press Enter for more search options.</p>
            : items.length ? <div className="header-number-search__list">{items.map((item) => <Link key={item.number_id} to={`/number/${item.number_id}`} onClick={() => setOpen(false)} className="header-number-search__result">
              <span><strong><span data-no-translate>{formatNumberDisplay(item.display_number, getPrimaryCategory(item))}</span></strong><small>{item.primary_category?.name || item.title_label || 'VIP Number'}</small></span>
              <span className="header-number-search__price">{formatINR(item.offer_price)}<ArrowRight size={14} aria-hidden="true" /></span>
            </Link>)}</div>
              : <p className="header-number-search__message">No matching public numbers found. Try another pattern or open the full search.</p>}
      <div className="header-number-search__footer">
        {items.length < total && <button type="button" onClick={loadMore} disabled={moreLoading || loading}>{moreLoading ? 'Loading…' : 'View more'}</button>}
        <Link to={viewAll} onClick={() => setOpen(false)}>View all <ArrowRight size={15} aria-hidden="true" /></Link>
      </div>
    </div>}
  </div>;
}
