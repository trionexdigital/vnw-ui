import { ThemedSelect } from '@/shared/ui/themed-select';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/shared/ui/select';
import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Clock3, Crown, Fingerprint, Heart, Layers3, ListFilter, Search, ShieldCheck, Sparkles, Users, Zap } from 'lucide-react';
import { numbersAPI, siteAPI, type CorporatePack, type CorporatePackType, type NumberListRequest } from '@/core/api/vnwAPI';
import type { NumberItem } from '@/shared/components/NumberCard';
import NumberCard from '@/shared/components/NumberCard';
import FamilyPackCard from '@/shared/components/FamilyPackCard';
import './HomeDiscovery.css';
import { useLanguage } from '@/shared/language/LanguageContext';

const BATCH_SIZE = 7;

type ShelfChoice = { label: string; query: NumberListRequest; href: string; example?: string };

export const homeShelves: Array<{
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  choices: ShelfChoice[];
  tone: 'light' | 'cream';
}> = [
  {
    id: 'mirror', eyebrow: '01 / The pattern gallery', title: 'Mirror & symmetry',
    description: 'Numbers with a striking reflection, reversal or balanced rhythm.', tone: 'cream',
    choices: [
      { label: 'Mirror', query: { category: 'customer-care-numbers' }, href: '/shop?category=customer-care-numbers', example: 'AB CDE · AB CDE' },
      { label: 'Semi Mirror', query: { category: 'semi-mirror-vip-mobile-number' }, href: '/shop?category=semi-mirror-vip-mobile-number', example: 'AB CDE · ED CBA' },
      { label: '10-digit symmetry', query: { category: 'best-mobile-number' }, href: '/shop?category=best-mobile-number', example: 'A B C D E · A B C D E' },
      { label: 'Semi Mirror with 00', query: { category: 'customer-care-numbers', subcategory_id: 5 }, href: '/shop?category=customer-care-numbers&subcategory_id=5', example: '00 · reflection' },
    ],
  },
  {
    id: 'repeat', eyebrow: '02 / Signature repeats', title: 'The repeat collection',
    description: 'Explore memorable runs from four matching digits to rare seven- and eight-digit patterns.', tone: 'light',
    choices: [
      { label: 'Tetra · 4', query: { category: 'choice-mobile-number' }, href: '/shop?category=choice-mobile-number', example: '7777' },
      { label: 'Penta · 5', query: { category: 'penta-vip-mobile-no' }, href: '/shop?category=penta-vip-mobile-no', example: '88888' },
      { label: 'Hexa · 6', query: { category: 'buy-vip-mobile-number-online' }, href: '/shop?category=buy-vip-mobile-number-online', example: '999999' },
      { label: 'Septa / Octa', query: { category: 'septa-octa-vip-number-for-sale' }, href: '/shop?category=septa-octa-vip-number-for-sale', example: '7777777+' },
    ],
  },
  {
    id: 'zero', eyebrow: '03 / Minimal & memorable', title: 'The zero collection',
    description: 'Beautiful endings, repeated zeros and patterns that are easy to remember.', tone: 'cream',
    choices: [
      { label: '000', query: { category: 'vip-number-000' }, href: '/shop?category=vip-number-000', example: '000' },
      { label: '0000 ending', query: { category: 'choice-mobile-number', subcategory_id: 90 }, href: '/shop?category=choice-mobile-number&subcategory_id=90', example: '0000' },
      { label: '00000 ending', query: { category: 'penta-vip-mobile-no', subcategory_id: 91 }, href: '/shop?category=penta-vip-mobile-no&subcategory_id=91', example: '00000' },
      { label: '00x00', query: { category: '00x00-fancy-number' }, href: '/shop?category=00x00-fancy-number', example: '00·00' },
      { label: '00xy00', query: { category: '00xy00-fancy-number' }, href: '/shop?category=00xy00-fancy-number', example: '00·XY·00' },
    ],
  },
  {
    id: 'rhythm', eyebrow: '04 / Numbers with rhythm', title: 'Sequences worth remembering',
    description: 'Pairs, triplets and rising sequences that sound as good as they look.', tone: 'cream',
    choices: [
      { label: 'Doubling', query: { category: 'doublling-aabbcc' }, href: '/shop?category=doublling-aabbcc', example: 'AA · BB · CC' },
      { label: 'Tripling', query: { category: 'unforgettable-vip-number' }, href: '/shop?category=unforgettable-vip-number', example: 'AAA · BBB' },
      { label: 'XYXYXY', query: { category: 'vip-mobile-number' }, href: '/shop?category=vip-mobile-number', example: 'XY · XY · XY' },
      { label: 'XYZXYZ', query: { category: 'xyzxyz-fancy-number' }, href: '/shop?category=xyzxyz-fancy-number', example: 'XYZ · XYZ' },
      { label: 'Counting', query: { category: 'ascending-descending-fancy-number' }, href: '/shop?category=ascending-descending-fancy-number', example: '1234 / 4321' },
    ],
  },
  {
    id: 'meaning', eyebrow: '05 / Personal significance', title: 'Numbers that mean more',
    description: 'Explore symbolic sequences or choose a number by its root sum.', tone: 'light',
    choices: [
      { label: '786', query: { category: '786-vip-mobile-numbers' }, href: '/shop?category=786-vip-mobile-numbers', example: '786' },
      { label: '13 repeating', query: { category: 'vip-number-1313' }, href: '/shop?category=vip-number-1313', example: '1313' },
      { label: 'Numerology', query: { category: 'numerology-numbers' }, href: '/shop?category=numerology-numbers', example: '1 — 9' },
    ],
  },
  {
    id: 'minimum-digits', eyebrow: '06 / Effortlessly memorable', title: 'Two-digit & minimal',
    description: 'A small set of distinct digits can make a number remarkably easy to remember.', tone: 'cream',
    choices: [
      { label: '2-digit numbers', query: { category: '2-digit-mobile-numbers', subcategory_id: 49 }, href: '/shop?category=2-digit-mobile-numbers&subcategory_id=49', example: 'Only two digits' },
      { label: '3-digit numbers', query: { category: '2-digit-mobile-numbers', subcategory_id: 54 }, href: '/shop?category=2-digit-mobile-numbers&subcategory_id=54', example: 'Only three digits' },
      { label: '3 digits with 0', query: { category: '2-digit-mobile-numbers', subcategory_id: 55 }, href: '/shop?category=2-digit-mobile-numbers&subcategory_id=55', example: 'Clean zero patterns' },
    ],
  },
  {
    id: 'business-patterns', eyebrow: '07 / A signature that sticks', title: 'Business-ready patterns',
    description: 'Structured patterns that sound clear, look balanced and stay memorable.', tone: 'light',
    choices: [
      { label: 'ABAB · XYXY', query: { category: 'vip-number-india' }, href: '/shop?category=vip-number-india', example: 'Pairs in rhythm' },
      { label: 'ABCD · ABCD', query: { category: 'abcd-abcd-fancy-number' }, href: '/shop?category=abcd-abcd-fancy-number', example: 'Four-digit repeats' },
      { label: '8/9-digit symmetry', query: { category: '8-9-digits-symmetry' }, href: '/shop?category=8-9-digits-symmetry', example: 'Long-form balance' },
    ],
  },
];

const categoryShortcuts = [
  { label: 'Mirror', slug: 'customer-care-numbers' },
  { label: '2-digit', slug: '2-digit-mobile-numbers' },
  { label: 'Penta', slug: 'penta-vip-mobile-no' },
  { label: 'ABCD', slug: 'abcd-abcd-fancy-number' },
  { label: '786', slug: '786-vip-mobile-numbers' },
  { label: '0000', slug: 'vip-number-000' },
];

export function HomeCategoryShortcuts() {
  return <nav className="home-category-shortcuts" aria-label="Popular number patterns"><div className="home-discovery-container">
    <strong>Explore popular patterns</strong>
    <div>{categoryShortcuts.map(({ label, slug }) => <Link key={slug} to={`/shop?category=${slug}`}>{label}<ArrowRight size={13} aria-hidden="true" /></Link>)}</div>
    <Link className="home-category-shortcuts__all" to="/categories">All categories <ArrowRight size={15} aria-hidden="true" /></Link>
  </div></nav>;
}

const discoveryTiles = [
  { title: 'Mirror & symmetry', example: 'AB CDE · AB CDE', text: 'Reflections and balanced digits', href: '/shop?category=customer-care-numbers', icon: Fingerprint, className: 'mirror' },
  { title: 'Repeating royalty', example: '7777 · 88888', text: 'Tetra, Penta, Hexa and beyond', href: '/shop?category=choice-mobile-number', icon: Crown, className: 'repeat' },
  { title: 'Zeros & endings', example: '0000 · 00x00', text: 'Minimal patterns with impact', href: '/shop?category=vip-number-000', icon: Layers3, className: 'zero' },
  { title: 'Rhythm & sequences', example: 'XYXY · XYZXYZ', text: 'Pairs and progressions', href: '/shop?category=vip-mobile-number', icon: Sparkles, className: 'rhythm' },
];

export function HomePatternGallery() {
  return <section className="home-pattern-gallery" aria-labelledby="home-pattern-title">
    <div className="home-discovery-container">
      <div className="home-discovery-heading"><h2 id="home-pattern-title">Every pattern has a personality.</h2><Link to="/categories" className="home-discovery-view-all">Explore all patterns <ArrowRight size={17} /></Link></div>
      <div className="home-pattern-gallery__grid">{discoveryTiles.map((tile) => <Link key={tile.title} to={tile.href} className={`home-pattern-gallery__tile home-pattern-gallery__tile--${tile.className}`}>
        <tile.icon className="home-pattern-gallery__icon" aria-hidden="true" />
        <strong className="home-pattern-gallery__example">{tile.example}</strong>
        <span className="home-pattern-gallery__caption"><span><b>{tile.title}</b><small>{tile.text}</small></span><ArrowRight size={20} aria-hidden="true" /></span>
      </Link>)}</div>
    </div>
  </section>;
}

export function HomeReadinessPaths() {
  const paths = [
    { title: 'Ready to activate', badge: 'RTA', text: 'Explore numbers prepared for the activation process.', href: '/shop?rtp_status=RTA', icon: Zap },
    { title: 'Ready to port', badge: 'RTP', text: 'Begin the porting journey for an eligible number.', href: '/shop?rtp_status=RTP', icon: ShieldCheck },
    { title: 'Pre-book a number', badge: 'NON-RTP', text: 'See upcoming numbers and their ready-to-port dates.', href: '/pre-book', icon: Clock3 },
    { title: 'Match a whole group', badge: 'PACKS', text: 'Coordinate numbers for a family or business.', href: '/family-pack', icon: Users },
  ];
  return <section className="home-readiness" aria-labelledby="home-readiness-title"><div className="home-discovery-container">
    <div className="home-discovery-heading"><h2 id="home-readiness-title">What matters most to you?</h2></div>
    <div className="home-readiness__grid">{paths.map((path) => <Link key={path.badge} to={path.href} className="home-readiness__card"><span className="home-readiness__icon"><path.icon size={23} aria-hidden="true" /></span><span className="home-readiness__badge">{path.badge}</span><strong>{path.title}</strong><span>{path.text}</span><ArrowRight className="home-readiness__arrow" size={18} aria-hidden="true" /></Link>)}</div>
  </div></section>;
}

function MobileChoiceMenu({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <Select value={value} onValueChange={onChange}>
    <SelectTrigger aria-label={label} className="home-rail__mobile-filter-toggle"><ListFilter size={16} aria-hidden="true" /></SelectTrigger>
    <SelectContent className="themed-select-content">{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
  </Select>;
}

function HorizontalRail<T>({ items, render, loading, error, hasMore, loadingMore, onMore, label, size = 'number', title, titleId, filters, mobileFilter, mobileBeforeArrows, viewAllHref, viewAllLabel = 'View all' }: {
  items: T[];
  render: (item: T) => React.ReactNode;
  loading: boolean;
  error?: string;
  hasMore: boolean;
  loadingMore?: boolean;
  onMore?: () => void;
  label: string;
  size?: 'number' | 'family';
  title: string;
  titleId: string;
  filters?: React.ReactNode;
  mobileFilter?: React.ReactNode;
  mobileBeforeArrows?: React.ReactNode;
  viewAllHref: string;
  viewAllLabel?: string;
}) {
  const { t } = useLanguage();
  const railRef = useRef<HTMLDivElement>(null);
  const previousCount = useRef<number | null>(null);
  const railId = useId();
  const move = (direction: number) => {
    const rail=railRef.current;
    if(!rail || !rail.firstElementChild)return;
    const children=Array.from(rail.children) as HTMLElement[];
    const origin=children[0].getBoundingClientRect().left;
    const positions=children.map(child=>child.getBoundingClientRect().left-origin);
    const current=positions.reduce((nearest,position,index)=>Math.abs(position-rail.scrollLeft)<Math.abs(positions[nearest]-rail.scrollLeft)?index:nearest,0);
    const step=positions[1]||rail.clientWidth;
    const visible=Math.max(1,Math.round((rail.clientWidth+parseFloat(getComputedStyle(rail).columnGap))/step));
    const target=Math.max(0,Math.min(children.length-visible,current+direction*visible));
    rail.scrollTo({left:positions[target],behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  };
  const loadMore = () => {
    previousCount.current = items.length;
    onMore?.();
  };
  useEffect(() => {
    const previous = previousCount.current;
    if (previous === null || items.length <= previous) return;
    previousCount.current = null;
    const next = railRef.current?.children.item(previous) as HTMLElement | null;
    next?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  }, [items.length]);
  return <div className="home-rail" data-testid="home-rail">
    <div className="home-rail__controls"><h2 id={titleId}>{title}</h2>{filters && <div className="home-rail__filters">{filters}</div>}<div className="home-rail__actions"><span className="home-rail__count">{loading ? 'Finding…' : t('{count} shown',{count:items.length})}</span>{mobileBeforeArrows && <div className="home-rail__mobile-before-arrows">{mobileBeforeArrows}</div>}<button type="button" onClick={() => move(-1)} aria-label={t('Scroll {label} left',{label:t(label)})} aria-controls={railId}><ChevronLeft size={19} /></button><button type="button" onClick={() => move(1)} aria-label={t('Scroll {label} right',{label:t(label)})} aria-controls={railId}><ChevronRight size={19} /></button><Link to={viewAllHref} className="home-discovery-view-all">{viewAllLabel} <ArrowRight size={15} /></Link>{mobileFilter}</div></div>
    {error ? <p className="home-rail__message" role="status">{error}</p> : loading ? <div className={`home-rail__track home-rail__track--${size} home-rail__track--loading`} aria-label={t('Loading {label}',{label:t(label)})}>{Array.from({ length: 3 }, (_, index) => <div key={index} className={`home-rail__skeleton home-rail__skeleton--${size}`}><div className="home-rail__skeleton-hero"><span /><span /><span /></div><div className="home-rail__skeleton-stats"><span /><span /></div>{size === 'family' && <div className="home-rail__skeleton-row" />}<div className="home-rail__skeleton-price" /><div className="home-rail__skeleton-actions"><span /><span /></div></div>)}</div> : items.length ? <div id={railId} ref={railRef} className={`home-rail__track home-rail__track--${size}`} role="region" aria-label={label} tabIndex={0}>
      {items.map(render)}
      {hasMore && <button type="button" className="home-rail__more" onClick={loadMore} disabled={loadingMore}><span><ArrowRight size={24} /></span><strong>{loadingMore ? 'Loading more…' : t('Show {count} more',{count:BATCH_SIZE})}</strong><small>Keep exploring this collection</small></button>}
    </div> : <div className="home-rail__message">No public numbers are available in this selection right now. Try another pattern or view the full shop.</div>}
  </div>;
}

export function HomeNumberShelf({ id, title, choices, tone = 'light', query, href }: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  choices?: ShelfChoice[];
  tone?: 'light' | 'cream';
  query?: NumberListRequest;
  href?: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = choices?.[selectedIndex];
  const activeQuery = selected?.query || query || {};
  const queryKey = JSON.stringify(activeQuery);
  const [items, setItems] = useState<NumberItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setItems([]); setTotal(0); setPage(1); setLoading(true); setError('');
    numbersAPI.list({ ...activeQuery, page: 1, limit: BATCH_SIZE })
      .then((data) => { if (active) { setItems(data.items || []); setTotal(Number(data.total || 0)); } })
      .catch((requestError: Error) => { if (active) setError(requestError.message || 'Could not load this collection.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [queryKey]);

  const loadMore = () => {
    if (loadingMore || loading || items.length >= total) return;
    setLoadingMore(true);
    numbersAPI.list({ ...activeQuery, page: page + 1, limit: BATCH_SIZE })
      .then((data) => {
        const next = data.items || [];
        setItems((current) => { const ids = new Set(current.map((item) => item.number_id)); return [...current, ...next.filter((item: NumberItem) => !ids.has(item.number_id))]; });
        setTotal(Number(data.total || 0));
        setPage((current) => current + 1);
      })
      .catch((requestError: Error) => setError(requestError.message || 'Could not load more numbers.'))
      .finally(() => setLoadingMore(false));
  };
  const activeHref = selected?.href || href || '/shop';

  return <section id={id} className={`home-number-shelf home-number-shelf--${tone}`} aria-labelledby={`${id}-title`}><div className="home-discovery-container">
    <HorizontalRail key={queryKey} title={title} titleId={`${id}-title`} viewAllHref={activeHref} filters={choices && <><div className="home-number-shelf__choices" role="group" aria-label={`Explore ${title}`}>
      {choices.map((choice, index) => <button key={`${choice.label}-${index}`} type="button" onClick={() => setSelectedIndex(index)} aria-pressed={selectedIndex === index} className="home-number-shelf__choice"><strong>{choice.label}</strong>{choice.example && <small>{choice.example}</small>}</button>)}
    </div><ThemedSelect aria-label={`Explore ${title}`} value={String(selectedIndex)} onChange={(event) => setSelectedIndex(Number(event.target.value))} className="home-number-shelf__mobile-choice">{choices.map((choice, index) => <option key={`${choice.label}-${index}`} value={index}>{choice.label}</option>)}</ThemedSelect></>} mobileFilter={choices && <MobileChoiceMenu label={`Choose ${title} selection`} value={String(selectedIndex)} onChange={(value) => setSelectedIndex(Number(value))} options={choices.map((choice, index) => ({ value: String(index), label: choice.label }))} />} items={items} render={(item) => <div key={item.number_id} className="home-rail__item"><NumberCard item={item} compact groupingCategory={activeQuery.category} /></div>} loading={loading} error={error} hasMore={items.length < total} loadingMore={loadingMore} onMore={loadMore} label={`${title} numbers`} />
  </div></section>;
}

const packTypes: Array<{ type: CorporatePackType; label: string }> = [
  { type: 'MIXED', label: 'All Mixed' }, { type: 'SERIES', label: 'In Series' },
  { type: 'SIMILAR_START', label: 'Similar Start' }, { type: 'SIMILAR_END', label: 'Similar End' },
  { type: 'SIMILAR_BOTH', label: 'Both Ends' },
];

export function HomeFamilyShelf() {
  const [type, setType] = useState<CorporatePackType>('MIXED');
  const [size, setSize] = useState(2);
  const [packs, setPacks] = useState<CorporatePack[]>([]);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true); setPacks([]); setVisibleCount(BATCH_SIZE); setError('');
    siteAPI.familyPacks({ pack_type: type, size, limit: 28 })
      .then((data) => { if (active) setPacks((data || []).filter((pack) => pack.is_available)); })
      .catch((requestError: Error) => { if (active) setError(requestError.message || 'Could not load matching packs.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [type, size]);

  return <section className="home-family-shelf" aria-labelledby="home-family-title"><div className="home-discovery-container">
    <HorizontalRail key={`${type}-${size}`} title="Family packs" titleId="home-family-title" viewAllHref="/family-pack" viewAllLabel="View all packs" filters={<div className="home-family-shelf__filters"><div role="group" aria-label="Family pack matching style">{packTypes.map((option) => <button key={option.type} type="button" aria-pressed={type === option.type} onClick={() => setType(option.type)}>{option.label}</button>)}</div><ThemedSelect aria-label="Family pack matching style" value={type} onChange={(event) => setType(event.target.value as CorporatePackType)} className="home-family-shelf__mobile-type">{packTypes.map((option) => <option key={option.type} value={option.type}>{option.label}</option>)}</ThemedSelect><label>Pack of <ThemedSelect aria-label="Pack of" value={size} onChange={(event) => setSize(Number(event.target.value))}>{[2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}</ThemedSelect></label></div>} mobileBeforeArrows={<label className="home-family-shelf__mobile-size"><span>Pack of</span><ThemedSelect aria-label="Pack of" title="Pack of" value={size} onChange={(event) => setSize(Number(event.target.value))}>{[2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}</ThemedSelect></label>} mobileFilter={<MobileChoiceMenu label="Choose Family packs selection" value={type} onChange={(value) => setType(value as CorporatePackType)} options={packTypes.map((option) => ({ value: option.type, label: option.label }))} />} items={packs.slice(0, visibleCount)} render={(pack) => <div key={pack.pack_id} className="home-rail__item"><FamilyPackCard pack={pack} compact /></div>} loading={loading} error={error} hasMore={visibleCount < packs.length} onMore={() => setVisibleCount((count) => count + BATCH_SIZE)} label="Family and business packs" size="family" />
  </div></section>;
}

export const budgetChoices: ShelfChoice[] = [
  { label: 'Under ₹5,000', query: { price_max: 5000, sort: 'price_asc' }, href: '/shop?price_max=5000&sort=price_asc', example: 'A memorable start' },
  { label: '₹5,000–₹20,000', query: { price_min: 5000, price_max: 20000, sort: 'price_asc' }, href: '/shop?price_min=5000&price_max=20000&sort=price_asc', example: 'Everyday favourites' },
  { label: '₹20,000–₹50,000', query: { price_min: 20000, price_max: 50000, sort: 'price_asc' }, href: '/shop?price_min=20000&price_max=50000&sort=price_asc', example: 'Signature choices' },
  { label: '₹50,000+', query: { price_min: 50000, sort: 'price_asc' }, href: '/shop?price_min=50000&sort=price_asc', example: 'Statement numbers' },
];

export function HomeTrustStrip() {
  return <div className="home-trust-strip"><div className="home-discovery-container"><span><ShieldCheck size={17} /> Clear prices</span><span><Search size={17} /> Search live public stock</span><span><Heart size={17} /> Save and compare favourites</span><span><Users size={17} /> Help when you need it</span></div></div>;
}
