import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  BrainCircuit,
  ChevronDown,
  IndianRupee,
  PencilLine,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/collapsible';
import { cn } from '@/core/lib/utils';
import {
  PATTERN_PRESETS,
  PRICE_BANDS,
  SearchMode,
  SearchState,
  readSearchState,
  writeSearchState,
} from './searchTypes';

interface SearchWorkbenchProps {
  placement?: 'home' | 'shop';
  loading?: boolean;
  error?: string;
}

type FieldErrors = Record<string, string>;
type AdvancedSectionKey = 'position' | 'include' | 'sums' | 'mask' | 'frequency';

const MODE_TABS: Array<{ value: SearchMode; label: string; icon: typeof Search }> = [
  { value: 'ai', label: 'AI Search', icon: BrainCircuit },
  { value: 'global', label: 'Global Search', icon: Search },
  { value: 'price', label: 'Search by Price', icon: IndianRupee },
  { value: 'advanced', label: 'Advanced Search', icon: Settings2 },
];

const numericValue = (value: string, length = 10) => value.replace(/\D/g, '').slice(0, length);
const commaDigits = (value: string) =>
  value.replace(/[^\d,\s]/g, '').replace(/\s+/g, '').slice(0, 109);

function validate(state: SearchState): FieldErrors {
  const errors: FieldErrors = {};
  const priceMin = state.priceMin === '' ? undefined : Number(state.priceMin);
  const priceMax = state.priceMax === '' ? undefined : Number(state.priceMax);
  if (priceMin !== undefined && (priceMin < 0 || priceMin > 1000000)) {
    errors.priceMin = 'Minimum price must be from ₹0 to ₹10,00,000.';
  }
  if (priceMax !== undefined && (priceMax < 0 || priceMax > 1000000)) {
    errors.priceMax = 'Maximum price must be from ₹0 to ₹10,00,000.';
  }
  if (priceMin !== undefined && priceMax !== undefined && priceMin > priceMax) {
    errors.priceMax = 'Maximum price must be at least the minimum price.';
  }
  if (state.mode === 'ai' && !state.ai.trim()) errors.ai = 'Describe the VIP number you want.';
  if (state.mode === 'global' && !state.globalDigits) errors.globalDigits = 'Enter at least one digit.';
  if (state.mode === 'advanced') {
    const hasPredicate = Boolean(
      state.startsWith || state.startsPattern || state.anywhere || state.endsWith || state.endsPattern
      || state.mustContain || state.mustNotContain || state.digitSum || state.midSum
      || state.scoreSum || state.exactMask || state.frequencies.length
      || state.priceMin || state.priceMax,
    );
    if (!hasPredicate) errors.advanced = 'Add at least one advanced search condition.';
    if (state.startsWith && state.startsPattern) errors.startsWith = 'Choose literal digits or a preset, not both.';
    if (state.endsWith && state.endsPattern) errors.endsWith = 'Choose literal digits or a preset, not both.';
    if (state.exactMask && !/^[\d?]{10}$/.test(state.exactMask)) {
      errors.exactMask = 'Use exactly 10 positions containing digits or ? wildcards.';
    }
    if (state.digitSum && Number(state.digitSum) > 90) errors.digitSum = 'Full digit sum can be 0 to 90.';
    if (state.midSum && Number(state.midSum) > 17) errors.midSum = 'Mid sum can be 0 to 17.';
    if (state.scoreSum && (Number(state.scoreSum) < 1 || Number(state.scoreSum) > 9)) {
      errors.scoreSum = 'Root sum can be 1 to 9.';
    }
    const seen = new Set<string>();
    state.frequencies.forEach((group, index) => {
      if (!group.digit) errors[`frequency-${index}`] = 'Choose a digit.';
      else if (seen.has(group.digit)) errors[`frequency-${index}`] = 'Each digit can only be used once.';
      else seen.add(group.digit);
      if (!group.min && !group.max) errors[`frequency-${index}`] = 'Add a minimum or maximum count.';
      if (group.min && (Number(group.min) < 1 || Number(group.min) > 10)) {
        errors[`frequency-${index}`] = 'Minimum count must be 1 to 10.';
      }
      if (group.max && (Number(group.max) < 1 || Number(group.max) > 10)) {
        errors[`frequency-${index}`] = 'Maximum count must be 1 to 10.';
      }
      if (group.min && group.max && Number(group.min) > Number(group.max)) {
        errors[`frequency-${index}`] = 'Minimum cannot exceed maximum.';
      }
    });
  }
  return errors;
}

function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return <p id={id} className="mt-1 text-xs font-semibold text-destructive">{message}</p>;
}

function AdvancedSection({
  title,
  description,
  open,
  onOpenChange,
  children,
}: {
  title: string;
  description: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="overflow-hidden rounded-xl border border-border bg-card">
      <CollapsibleTrigger className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-primary/5">
        <span>
          <span className="block text-sm font-black text-foreground">{title}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-primary transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t border-border bg-muted/25 p-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function SearchWorkbench({
  placement = 'shop',
  loading = false,
  error = '',
}: SearchWorkbenchProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const isShop = placement === 'shop';
  const initialState = useMemo(
    () => readSearchState(isShop ? params : new URLSearchParams()),
    // Initial hydration only; URL changes are handled by the effect below.
    [],
  );
  const [state, setState] = useState<SearchState>(initialState);
  const [advancedDraft, setAdvancedDraft] = useState<SearchState>(initialState);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [advancedOpen, setAdvancedOpen] = useState(
    isShop && initialState.mode === 'advanced' && !location.state?.advancedSearchApplied,
  );
  const [openSections, setOpenSections] = useState<Record<AdvancedSectionKey, boolean>>({
    position: true,
    include: false,
    sums: false,
    mask: false,
    frequency: false,
  });
  const firstInputRef = useRef<HTMLInputElement>(null);
  const advancedFirstInputRef = useRef<HTMLInputElement>(null);
  const advancedTriggerRef = useRef<HTMLButtonElement>(null);
  const modeBeforeAdvanced = useRef<SearchMode>(initialState.mode);
  const paramsKey = params.toString();

  useEffect(() => {
    if (!isShop) return;
    const next = readSearchState(params);
    setState(next);
    setAdvancedDraft(next);
  }, [isShop, paramsKey]);

  useEffect(() => {
    if (isShop && params.get('focus') === 'search') {
      const frame = window.requestAnimationFrame(() => {
        document.getElementById('vip-search-workbench')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        firstInputRef.current?.focus();
      });
      return () => window.cancelAnimationFrame(frame);
    }
  }, [isShop, paramsKey]);

  const clearErrors = (...keys: string[]) => {
    setErrors((current) => {
      const next: FieldErrors = { ...current, advanced: '' };
      keys.forEach((key) => { next[key] = ''; });
      return next;
    });
  };

  const updateState = <K extends keyof SearchState>(key: K, value: SearchState[K]) => {
    setState((current) => ({ ...current, [key]: value }));
    clearErrors(String(key));
  };

  const updateDraft = <K extends keyof SearchState>(key: K, value: SearchState[K]) => {
    setAdvancedDraft((current) => ({ ...current, [key]: value }));
    clearErrors(String(key));
  };

  const submitState = (nextState: SearchState, appliedFromAdvanced = false) => {
    const next = writeSearchState(isShop ? params : new URLSearchParams(), nextState);
    next.delete('focus');
    if (isShop) setParams(next);
    else navigate(`/shop?${next.toString()}`, appliedFromAdvanced ? { state: { advancedSearchApplied: true } } : undefined);
  };

  const submitSimple = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(state);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    submitState(state);
  };

  const selectMode = (mode: SearchMode) => {
    if (mode === 'advanced') {
      modeBeforeAdvanced.current = state.mode;
      const draft = state.mode === 'advanced'
        ? state
        : { ...advancedDraft, mode: 'advanced' as const, priceMin: state.priceMin, priceMax: state.priceMax };
      setAdvancedDraft(draft);
      setState((current) => ({ ...current, mode: 'advanced' }));
      setErrors({});
      setAdvancedOpen(true);
      return;
    }
    setErrors({});
    setState((current) => ({ ...current, mode }));
  };

  const cancelAdvanced = () => {
    setAdvancedOpen(false);
    setErrors({});
    const committed = isShop
      ? readSearchState(params)
      : { ...state, mode: modeBeforeAdvanced.current };
    setState(committed);
    setAdvancedDraft(committed);
  };

  const resetAdvanced = () => {
    const blank = readSearchState(new URLSearchParams('mode=advanced'));
    setAdvancedDraft(blank);
    setErrors({});
    setOpenSections({ position: true, include: false, sums: false, mask: false, frequency: false });
  };

  const applyAdvanced = (event: FormEvent) => {
    event.preventDefault();
    const draft = { ...advancedDraft, mode: 'advanced' as const };
    const nextErrors = validate(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setOpenSections((current) => ({
        ...current,
        position: current.position || Boolean(nextErrors.advanced || nextErrors.startsWith || nextErrors.endsWith),
        sums: current.sums || Boolean(nextErrors.digitSum || nextErrors.midSum || nextErrors.scoreSum || nextErrors.priceMin || nextErrors.priceMax),
        mask: current.mask || Boolean(nextErrors.exactMask),
        frequency: current.frequency || Object.keys(nextErrors).some((key) => key.startsWith('frequency-')),
      }));
      return;
    }
    setState(draft);
    setAdvancedDraft(draft);
    setAdvancedOpen(false);
    setErrors({});
    submitState(draft, true);
  };

  const activePriceValue = `${state.priceMin}:${state.priceMax}`;
  const activePriceBand = useMemo(
    () => PRICE_BANDS.find((band) => band.min === state.priceMin && band.max === state.priceMax),
    [state.priceMin, state.priceMax],
  );
  const activePriceLabel = activePriceBand?.label || 'Custom price range';
  const advancedSummary = useMemo(() => {
    const summary: string[] = [];
    if (state.startsWith) summary.push(`Starts ${state.startsWith}`);
    if (state.startsPattern) summary.push(`Starts: ${PATTERN_PRESETS.find((item) => item.value === state.startsPattern)?.label}`);
    if (state.anywhere) summary.push(`Anywhere ${state.anywhere}`);
    if (state.endsWith) summary.push(`Ends ${state.endsWith}`);
    if (state.endsPattern) summary.push(`Ends: ${PATTERN_PRESETS.find((item) => item.value === state.endsPattern)?.label}`);
    if (state.mustContain) summary.push(`Contains ${state.mustContain}`);
    if (state.mustNotContain) summary.push(`Excludes ${state.mustNotContain}`);
    if (state.exactMask) summary.push(`Mask ${state.exactMask}`);
    if (state.digitSum) summary.push(`Sum ${state.digitSum}`);
    if (state.scoreSum) summary.push(`Root ${state.scoreSum}`);
    if (state.frequencies.length) summary.push(`${state.frequencies.length} digit rule${state.frequencies.length > 1 ? 's' : ''}`);
    if (state.priceMin || state.priceMax) summary.push(activePriceLabel);
    return summary;
  }, [state, activePriceLabel]);

  const inputClass = (invalid = false) =>
    `input-luxury h-11 w-full text-base ${invalid ? '!border-destructive !ring-2 !ring-destructive/15' : ''}`;
  const draftInputClass = (invalid = false) =>
    `input-luxury h-10 w-full !rounded-lg px-3 py-2 text-base ${invalid ? '!border-destructive !ring-2 !ring-destructive/15' : ''}`;

  return (
    <section
      id="vip-search-workbench"
      className={`${placement === 'home' ? 'bg-background px-4 py-5 sm:px-6 lg:px-8' : 'mb-5'} scroll-mt-24`}
      aria-labelledby={`${placement}-search-title`}
    >
      <div className={placement === 'home' ? 'mx-auto max-w-7xl' : ''}>
        <div className="vnw-card overflow-hidden border-primary/25">
          <div className="vip-motif-surface flex flex-col gap-3 border-b border-border px-3 py-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative z-10 min-w-0">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h2 id={`${placement}-search-title`} className="text-lg font-black tracking-tight text-foreground sm:text-xl">
                    Find your signature VIP number
                  </h2>
                  <p className="hidden text-xs text-muted-foreground sm:block">AI, exact digits, budget, or specialist patterns.</p>
                </div>
              </div>
            </div>
            <div
              className="relative z-10 grid grid-cols-2 gap-1 rounded-xl border border-border bg-card/90 p-1 md:grid-cols-4 lg:min-w-[610px]"
              role="tablist"
              aria-label="VIP number search modes"
            >
              {MODE_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = state.mode === tab.value;
                return (
                  <button
                    key={tab.value}
                    ref={tab.value === 'advanced' ? advancedTriggerRef : undefined}
                    type="button"
                    role="tab"
                    id={`search-tab-${tab.value}`}
                    aria-controls={tab.value === 'advanced' ? 'advanced-search-dialog' : `search-panel-${tab.value}`}
                    aria-selected={active}
                    onClick={() => selectMode(tab.value)}
                    className={cn(
                      'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm',
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-primary/10 hover:text-primary',
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {state.mode !== 'advanced' && (
            <form onSubmit={submitSimple} noValidate>
              <div
                id={`search-panel-${state.mode}`}
                role="tabpanel"
                aria-labelledby={`search-tab-${state.mode}`}
                className="p-3 sm:p-4"
              >
                {state.mode === 'ai' && (
                  <div className="mx-auto max-w-5xl">
                    <div className="grid items-end gap-2 md:grid-cols-[1fr_auto]">
                      <label htmlFor={`${placement}-ai-query`} className="block">
                        <span className="mb-1 block text-xs font-black text-foreground">Describe the number you want</span>
                        <input
                          ref={firstInputRef}
                          id={`${placement}-ai-query`}
                          value={state.ai}
                          onChange={(event) => updateState('ai', event.target.value)}
                          maxLength={500}
                          placeholder="e.g. mirror number ending in 786 under ₹30,000"
                          aria-invalid={Boolean(errors.ai)}
                          aria-describedby={errors.ai ? `${placement}-ai-error` : `${placement}-ai-help`}
                          className={inputClass(Boolean(errors.ai))}
                        />
                      </label>
                      <button disabled={loading} className="btn-royal min-h-11 min-w-36 disabled:opacity-60">
                        <BrainCircuit className="h-4 w-4" aria-hidden="true" />
                        {loading ? 'Searching…' : 'Ask AI'}
                      </button>
                    </div>
                    <ErrorText id={`${placement}-ai-error`} message={errors.ai} />
                    <div id={`${placement}-ai-help`} className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-semibold">Try:</span>
                      {['786 at the end under ₹30,000', 'mirror with root sum 9'].map((example) => (
                        <button key={example} type="button" onClick={() => updateState('ai', example)} className="font-bold text-primary hover:underline">
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {state.mode === 'global' && (
                  <div className="mx-auto grid max-w-5xl items-end gap-2 sm:grid-cols-[180px_1fr_auto]">
                    <label className="block">
                      <span className="mb-1 block text-xs font-black text-foreground">Match position</span>
                      <span className="relative block">
                        <select
                          value={state.globalScope}
                          onChange={(event) => updateState('globalScope', event.target.value as SearchState['globalScope'])}
                          className={`${inputClass()} appearance-none pr-10`}
                        >
                          <option value="anywhere">Anywhere</option>
                          <option value="starts_with">Starts With</option>
                          <option value="ends_with">Ends With</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </span>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-black text-foreground">Digits</span>
                      <input
                        ref={firstInputRef}
                        value={state.globalDigits}
                        onChange={(event) => updateState('globalDigits', numericValue(event.target.value))}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={10}
                        placeholder="e.g. 9999 or 786"
                        aria-invalid={Boolean(errors.globalDigits)}
                        aria-describedby={errors.globalDigits ? `${placement}-global-error` : undefined}
                        className={inputClass(Boolean(errors.globalDigits))}
                      />
                      <ErrorText id={`${placement}-global-error`} message={errors.globalDigits} />
                    </label>
                    <button disabled={loading} className="btn-royal min-h-11 min-w-32 disabled:opacity-60">
                      <Search className="h-4 w-4" aria-hidden="true" />
                      Search
                    </button>
                  </div>
                )}

                {state.mode === 'price' && (
                  <div className="mx-auto grid max-w-4xl items-end gap-2 sm:grid-cols-[1fr_auto]">
                    <label className="block">
                      <span className="mb-1 block text-xs font-black text-foreground">Inclusive price range</span>
                      <span className="relative block">
                        <select
                          aria-label="Inclusive price range"
                          value={activePriceValue}
                          onChange={(event) => {
                            const [priceMin, priceMax] = event.target.value.split(':');
                            setState((current) => ({ ...current, priceMin, priceMax }));
                            setErrors({});
                          }}
                          className={`${inputClass()} appearance-none pr-10`}
                        >
                          {!activePriceBand && <option value={activePriceValue}>Custom price range</option>}
                          {PRICE_BANDS.map((band) => <option key={band.label} value={`${band.min}:${band.max}`}>{band.label}</option>)}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </span>
                    </label>
                    <button disabled={loading} className="btn-royal min-h-11 min-w-40 disabled:opacity-60">Show Numbers</button>
                  </div>
                )}

                <div aria-live="polite" className="mt-2 min-h-4 text-xs">
                  {loading && <span className="font-semibold text-primary">Searching the marketplace…</span>}
                  {!loading && error && <span className="font-semibold text-destructive">{error}</span>}
                </div>
              </div>
            </form>
          )}

          {state.mode === 'advanced' && !advancedOpen && (
            <div id="search-panel-advanced" role="tabpanel" aria-labelledby="search-tab-advanced" className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[.12em] text-primary">Advanced filters applied</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(advancedSummary.length ? advancedSummary : ['No advanced conditions']).map((item) => (
                    <span key={item} className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{item}</span>
                  ))}
                </div>
              </div>
              <button type="button" onClick={() => selectMode('advanced')} className="btn-gold-outline min-h-10 shrink-0">
                <PencilLine className="h-4 w-4" aria-hidden="true" /> Edit Search
              </button>
            </div>
          )}
        </div>
      </div>

      <Dialog.Root open={advancedOpen} onOpenChange={(open) => { if (!open) cancelAdvanced(); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="advanced-search-overlay" />
          <Dialog.Content
            id="advanced-search-dialog"
            className="advanced-search-drawer"
            onOpenAutoFocus={(event) => {
              if (advancedFirstInputRef.current) {
                event.preventDefault();
                advancedFirstInputRef.current.focus();
              }
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              advancedTriggerRef.current?.focus();
            }}
          >
            <form onSubmit={applyAdvanced} noValidate className="flex h-full min-h-0 flex-col">
              <div className="vip-motif-surface relative shrink-0 border-b border-border px-4 py-4 pr-14 sm:px-5">
                <Dialog.Title className="relative z-10 text-lg font-black text-foreground sm:text-xl">Advanced VIP Number Search</Dialog.Title>
                <Dialog.Description className="relative z-10 mt-1 text-xs leading-5 text-muted-foreground">
                  Combine number positions, patterns, sums, price, masks, and digit-frequency rules.
                </Dialog.Description>
                <button type="button" onClick={cancelAdvanced} aria-label="Close advanced search" className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-foreground transition hover:border-primary hover:text-primary">
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 sm:p-4">
                {errors.advanced && (
                  <div role="alert" className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                    {errors.advanced}
                  </div>
                )}

                <AdvancedSection
                  title="Position and patterns"
                  description="Starts with, anywhere, ends with, and pattern presets"
                  open={openSections.position}
                  onOpenChange={(open) => setOpenSections((current) => ({ ...current, position: open }))}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-black text-foreground" htmlFor={`${placement}-starts`}>Starts With</label>
                      <input
                        id={`${placement}-starts`}
                        ref={advancedFirstInputRef}
                        value={advancedDraft.startsWith}
                        onChange={(event) => {
                          setAdvancedDraft((current) => ({ ...current, startsWith: numericValue(event.target.value), startsPattern: '' }));
                          clearErrors('startsWith');
                        }}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Literal digits"
                        aria-invalid={Boolean(errors.startsWith)}
                        aria-describedby={errors.startsWith ? `${placement}-starts-error` : undefined}
                        className={`${draftInputClass(Boolean(errors.startsWith))} mt-1`}
                      />
                      <ErrorText id={`${placement}-starts-error`} message={errors.startsWith} />
                      <label className="mt-2 block text-[11px] font-bold text-muted-foreground" htmlFor={`${placement}-starts-pattern`}>Or preset</label>
                      <select
                        id={`${placement}-starts-pattern`}
                        value={advancedDraft.startsPattern}
                        onChange={(event) => {
                          setAdvancedDraft((current) => ({
                            ...current,
                            startsWith: '',
                            startsPattern: event.target.value as SearchState['startsPattern'],
                          }));
                          clearErrors('startsWith');
                        }}
                        className={`${draftInputClass()} mt-1`}
                      >
                        <option value="">No preset</option>
                        {PATTERN_PRESETS.map((preset) => <option key={preset.value} value={preset.value}>{preset.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-foreground" htmlFor={`${placement}-anywhere`}>Anywhere</label>
                      <input
                        id={`${placement}-anywhere`}
                        value={advancedDraft.anywhere}
                        onChange={(event) => updateDraft('anywhere', numericValue(event.target.value))}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Digits anywhere"
                        className={`${draftInputClass()} mt-1`}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-black text-foreground" htmlFor={`${placement}-ends`}>Ends With</label>
                      <div className="mt-1 grid gap-2 sm:grid-cols-2">
                        <div>
                          <input
                            id={`${placement}-ends`}
                            value={advancedDraft.endsWith}
                            onChange={(event) => {
                              setAdvancedDraft((current) => ({ ...current, endsWith: numericValue(event.target.value), endsPattern: '' }));
                              clearErrors('endsWith');
                            }}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Literal digits"
                            aria-invalid={Boolean(errors.endsWith)}
                            aria-describedby={errors.endsWith ? `${placement}-ends-error` : undefined}
                            className={draftInputClass(Boolean(errors.endsWith))}
                          />
                          <ErrorText id={`${placement}-ends-error`} message={errors.endsWith} />
                        </div>
                        <select
                          aria-label="Ends With pattern preset"
                          value={advancedDraft.endsPattern}
                          onChange={(event) => {
                            setAdvancedDraft((current) => ({
                              ...current,
                              endsWith: '',
                              endsPattern: event.target.value as SearchState['endsPattern'],
                            }));
                            clearErrors('endsWith');
                          }}
                          className={draftInputClass()}
                        >
                          <option value="">Or choose a preset</option>
                          {PATTERN_PRESETS.map((preset) => <option key={preset.value} value={preset.value}>{preset.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </AdvancedSection>

                <AdvancedSection
                  title="Required and excluded digits"
                  description="Every included group must match; every excluded group must be absent"
                  open={openSections.include}
                  onOpenChange={(open) => setOpenSections((current) => ({ ...current, include: open }))}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-black text-foreground">
                      Must Contain
                      <input
                        value={advancedDraft.mustContain}
                        onChange={(event) => updateDraft('mustContain', commaDigits(event.target.value))}
                        inputMode="numeric"
                        placeholder="e.g. 786, 99"
                        className={`${draftInputClass()} mt-1`}
                      />
                    </label>
                    <label className="text-xs font-black text-foreground">
                      Must Not Contain
                      <input
                        value={advancedDraft.mustNotContain}
                        onChange={(event) => updateDraft('mustNotContain', commaDigits(event.target.value))}
                        inputMode="numeric"
                        placeholder="e.g. 13, 00"
                        className={`${draftInputClass()} mt-1`}
                      />
                    </label>
                  </div>
                </AdvancedSection>

                <AdvancedSection
                  title="Sums and budget"
                  description="Full, mid, and root sums with an optional price range"
                  open={openSections.sums}
                  onOpenChange={(open) => setOpenSections((current) => ({ ...current, sums: open }))}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { key: 'digitSum' as const, label: 'Full Digit Sum', max: 90, help: '0 to 90' },
                      { key: 'midSum' as const, label: 'Mid Sum', max: 17, help: '0 to 17' },
                      { key: 'scoreSum' as const, label: 'Root Sum', max: 9, help: '1 to 9' },
                      { key: 'priceMin' as const, label: 'Minimum Price', max: 1000000, help: '₹0 to ₹10,00,000' },
                      { key: 'priceMax' as const, label: 'Maximum Price', max: 1000000, help: '₹0 to ₹10,00,000' },
                    ].map((field) => (
                      <label key={field.key} className="text-xs font-black text-foreground">
                        {field.label}
                        <input
                          value={advancedDraft[field.key]}
                          onChange={(event) => updateDraft(field.key, numericValue(event.target.value, 7))}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          max={field.max}
                          aria-invalid={Boolean(errors[field.key])}
                          aria-describedby={`${placement}-${field.key}-help`}
                          className={`${draftInputClass(Boolean(errors[field.key]))} mt-1`}
                        />
                        <span id={`${placement}-${field.key}-help`} className={cn('mt-1 block text-[11px] font-normal', errors[field.key] ? 'font-semibold text-destructive' : 'text-muted-foreground')}>
                          {errors[field.key] || field.help}
                        </span>
                      </label>
                    ))}
                  </div>
                </AdvancedSection>

                <AdvancedSection
                  title="Exact ten-position mask"
                  description="Fix individual positions and use ? as a wildcard"
                  open={openSections.mask}
                  onOpenChange={(open) => setOpenSections((current) => ({ ...current, mask: open }))}
                >
                  <label htmlFor={`${placement}-mask`} className="text-xs font-black text-foreground">Ten-position exact mask</label>
                  <input
                    id={`${placement}-mask`}
                    value={advancedDraft.exactMask}
                    onChange={(event) => updateDraft('exactMask', event.target.value.replace(/[^\d?]/g, '').slice(0, 10))}
                    inputMode="text"
                    maxLength={10}
                    placeholder="98??54????"
                    aria-invalid={Boolean(errors.exactMask)}
                    aria-describedby={`${placement}-mask-help`}
                    className={`${draftInputClass(Boolean(errors.exactMask))} mt-1 font-mono tracking-[.18em]`}
                  />
                  <p id={`${placement}-mask-help`} className={cn('mt-1 text-[11px]', errors.exactMask ? 'font-semibold text-destructive' : 'text-muted-foreground')}>
                    {errors.exactMask || 'Use ? for any digit; the mask must contain exactly 10 positions.'}
                  </p>
                </AdvancedSection>

                <AdvancedSection
                  title="Digit frequency"
                  description="Require minimum or maximum counts for up to ten unique digits"
                  open={openSections.frequency}
                  onOpenChange={(open) => setOpenSections((current) => ({ ...current, frequency: open }))}
                >
                  <button
                    type="button"
                    disabled={advancedDraft.frequencies.length >= 10}
                    onClick={() => updateDraft('frequencies', [...advancedDraft.frequencies, { digit: '', min: '', max: '' }])}
                    className="btn-gold-outline min-h-9 px-3 text-xs disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add digit rule
                  </button>
                  {advancedDraft.frequencies.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {advancedDraft.frequencies.map((frequency, index) => (
                        <div key={index} className="rounded-lg border border-border bg-card p-2.5">
                          <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
                            <label className="text-[11px] font-bold text-muted-foreground">
                              Digit
                              <select
                                value={frequency.digit}
                                aria-invalid={Boolean(errors[`frequency-${index}`])}
                                aria-describedby={errors[`frequency-${index}`] ? `${placement}-frequency-${index}-error` : undefined}
                                onChange={(event) => {
                                  const frequencies = [...advancedDraft.frequencies];
                                  frequencies[index] = { ...frequency, digit: event.target.value };
                                  updateDraft('frequencies', frequencies);
                                }}
                                className={`${draftInputClass(Boolean(errors[`frequency-${index}`]))} mt-1`}
                              >
                                <option value="">–</option>
                                {Array.from({ length: 10 }, (_, digit) => <option key={digit} value={digit}>{digit}</option>)}
                              </select>
                            </label>
                            <label className="text-[11px] font-bold text-muted-foreground">
                              Min
                              <input
                                value={frequency.min}
                                onChange={(event) => {
                                  const frequencies = [...advancedDraft.frequencies];
                                  frequencies[index] = { ...frequency, min: numericValue(event.target.value, 2) };
                                  updateDraft('frequencies', frequencies);
                                }}
                                inputMode="numeric"
                                className={`${draftInputClass(Boolean(errors[`frequency-${index}`]))} mt-1`}
                              />
                            </label>
                            <label className="text-[11px] font-bold text-muted-foreground">
                              Max
                              <input
                                value={frequency.max}
                                onChange={(event) => {
                                  const frequencies = [...advancedDraft.frequencies];
                                  frequencies[index] = { ...frequency, max: numericValue(event.target.value, 2) };
                                  updateDraft('frequencies', frequencies);
                                }}
                                inputMode="numeric"
                                className={`${draftInputClass(Boolean(errors[`frequency-${index}`]))} mt-1`}
                              />
                            </label>
                            <button
                              type="button"
                              aria-label={`Remove frequency group ${index + 1}`}
                              onClick={() => updateDraft('frequencies', advancedDraft.frequencies.filter((_, itemIndex) => itemIndex !== index))}
                              className="grid h-10 w-10 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                          <ErrorText id={`${placement}-frequency-${index}-error`} message={errors[`frequency-${index}`]} />
                        </div>
                      ))}
                    </div>
                  )}
                </AdvancedSection>
              </div>

              <div className="grid shrink-0 grid-cols-3 gap-2 border-t border-border bg-card p-3 shadow-[0_-8px_24px_rgba(31,29,26,.06)] sm:p-4">
                <button type="button" onClick={resetAdvanced} className="min-h-11 rounded-lg border border-border bg-muted px-3 text-sm font-bold text-muted-foreground transition hover:border-primary hover:text-primary">Reset</button>
                <button type="button" onClick={cancelAdvanced} className="min-h-11 rounded-lg border border-border bg-card px-3 text-sm font-bold text-foreground transition hover:border-primary">Cancel</button>
                <button disabled={loading} className="btn-royal min-h-11 px-3 disabled:opacity-60">
                  {loading ? 'Searching…' : 'Apply Search'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
