import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Crown,
  Pencil,
  Plus,
  Power,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  adminAPI,
  type DealOfDayItem,
  type DealOfDaySaveInput,
} from '@/core/api/vnwAPI';
import { formatINR } from '@/core/lib/format';
import { getPrimaryCategory } from '@/core/categories/types';
import { useToast } from '@/shared/hooks/use-toast';
import { EmptyState, Loader, PageHeader, StatusBadge, Table } from '@/shared/components/ui-bits';
import Modal from '@/shared/components/Modal';

type CatalogNumber = {
  number_id: number;
  display_number: string;
  number_value?: string;
  title_label?: string;
  offer_price: number;
  status?: string;
};

const blankForm: DealOfDaySaveInput = {
  number_id: 0,
  hero_label: '',
  hero_description: '',
  is_active: true,
};

const fieldClass = 'w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15';

function resolvedLabel(item: DealOfDayItem) {
  return item.hero_label || item.title_label || getPrimaryCategory(item)?.name || 'Signature VIP Number';
}

export default function AdminDealsOfDay() {
  const { toast } = useToast();
  const [items, setItems] = useState<DealOfDayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [form, setForm] = useState<DealOfDaySaveInput>(blankForm);
  const [catalog, setCatalog] = useState<CatalogNumber[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setItems(await adminAPI.dealsOfDayList());
    } catch (error: any) {
      toast({ title: 'Unable to load deals', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(async () => {
      setCatalogLoading(true);
      try {
        const response = await adminAPI.numbersList({
          status: 'AVAILABLE',
          q: search.trim() || undefined,
          limit: 60,
        });
        setCatalog(response.items || []);
      } catch {
        setCatalog([]);
      } finally {
        setCatalogLoading(false);
      }
    }, 220);
    return () => window.clearTimeout(timer);
  }, [open, search]);

  const selected = useMemo(() => {
    const fromCatalog = catalog.find((number) => number.number_id === Number(form.number_id));
    if (fromCatalog) return fromCatalog;
    const fromMaster = items.find((number) => number.number_id === Number(form.number_id));
    return fromMaster || null;
  }, [catalog, form.number_id, items]);

  const selectableCatalog = useMemo(() => {
    const selectedId = Number(form.number_id);
    const configuredIds = new Set(items.map((item) => item.number_id));
    return catalog.filter((number) => number.number_id === selectedId || !configuredIds.has(number.number_id));
  }, [catalog, form.number_id, items]);

  const set = <K extends keyof DealOfDaySaveInput>(key: K, value: DealOfDaySaveInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openNew = () => {
    setForm(blankForm);
    setSearch('');
    setOpen(true);
  };

  const openEdit = (item: DealOfDayItem) => {
    setForm({
      deal_id: item.deal_id,
      number_id: item.number_id,
      hero_label: item.hero_label || '',
      hero_description: item.hero_description || '',
      is_active: item.is_active,
    });
    setSearch(item.display_number);
    setOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.number_id) {
      toast({ title: 'Select a VIP number', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await adminAPI.dealOfDaySave(form);
      toast({ title: form.deal_id ? 'Deal updated' : 'Deal added' });
      setOpen(false);
      await load();
    } catch (error: any) {
      toast({ title: 'Could not save deal', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (item: DealOfDayItem) => {
    try {
      await adminAPI.dealOfDaySave({
        deal_id: item.deal_id,
        number_id: item.number_id,
        hero_label: item.hero_label,
        hero_description: item.hero_description,
        is_active: !item.is_active,
      });
      setItems((current) => current.map((row) => (
        row.deal_id === item.deal_id ? { ...row, is_active: !row.is_active } : row
      )));
      toast({ title: item.is_active ? 'Deal hidden' : 'Deal published' });
    } catch (error: any) {
      toast({ title: 'Could not update deal', description: error.message, variant: 'destructive' });
    }
  };

  const move = async (index: number, offset: number) => {
    const nextIndex = index + offset;
    if (ordering || nextIndex < 0 || nextIndex >= items.length) return;
    const next = [...items];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setItems(next);
    setOrdering(true);
    try {
      await adminAPI.dealsOfDayReorder(next.map((item) => Number(item.deal_id)));
      toast({ title: 'Deal order updated' });
    } catch (error: any) {
      setItems(items);
      toast({ title: 'Could not reorder deals', description: error.message, variant: 'destructive' });
    } finally {
      setOrdering(false);
    }
  };

  const remove = async (item: DealOfDayItem) => {
    if (!item.deal_id || !window.confirm(`Remove ${item.display_number} from Deal of the Day?`)) return;
    try {
      await adminAPI.dealOfDayDelete(item.deal_id);
      toast({ title: 'Deal removed', description: 'The catalog number was not deleted.' });
      await load();
    } catch (error: any) {
      toast({ title: 'Could not remove deal', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div>
      <PageHeader
        title="Deal of the Day"
        subtitle="Curate and order the premium numbers shown in the homepage hero"
        action={(
          <button type="button" onClick={openNew} className="btn-gold inline-flex items-center gap-2 text-sm">
            <Plus className="h-4 w-4" /> Add Deal
          </button>
        )}
      />

      <div className="mb-5 rounded-xl border border-primary/20 bg-primary/10 p-4 text-sm text-foreground">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>
            Active, available numbers appear in this order. Sold or inactive catalog numbers are hidden automatically;
            premium curated catalog numbers fill the hero only when no curated deals are eligible.
          </p>
        </div>
      </div>

      {loading ? <Loader /> : items.length === 0 ? (
        <EmptyState
          title="No curated deals yet"
          description="The storefront is currently using premium curated catalog numbers."
          action={<button type="button" onClick={openNew} className="btn-gold">Add the first deal</button>}
        />
      ) : (
        <Table head={['Order', 'Number', 'Hero Copy', 'Price', 'Catalog', 'Published', 'Actions']}>
          {items.map((item, index) => {
            const eligible = item.status === 'AVAILABLE' && Number(item.stock || 0) > 0;
            return (
              <tr key={item.deal_id || item.number_id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => void move(index, -1)}
                      disabled={ordering || index === 0}
                      aria-label={`Move ${item.display_number} up`}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void move(index, 1)}
                      disabled={ordering || index === items.length - 1}
                      aria-label={`Move ${item.display_number} down`}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-black tabular-nums text-foreground">{item.display_number}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{getPrimaryCategory(item)?.name || item.operator || 'VIP Number'}</div>
                </td>
                <td className="max-w-[260px] px-4 py-3">
                  <div className="truncate font-bold text-foreground">{resolvedLabel(item)}</div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    {item.hero_description || item.description || 'Highly desirable • Easy to remember'}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-foreground">{formatINR(item.offer_price)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={eligible ? 'AVAILABLE' : item.status || 'INACTIVE'} />
                  {!eligible && <div className="mt-1 text-[10px] font-bold text-destructive">Hidden from hero</div>}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => void toggle(item)}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ${
                      item.is_active ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Power className="h-3.5 w-3.5" /> {item.is_active ? 'Active' : 'Hidden'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => openEdit(item)} aria-label={`Edit ${item.display_number}`} className="text-muted-foreground hover:text-primary">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => void remove(item)} aria-label={`Remove ${item.display_number}`} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      <Modal open={open} onClose={() => !saving && setOpen(false)} title={form.deal_id ? 'Edit Deal of the Day' : 'Add Deal of the Day'} wide>
        <form onSubmit={save} className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Find an available catalog number</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search digits or display number"
                  className={`${fieldClass} pl-9`}
                />
              </div>
              <select
                required
                value={form.number_id || ''}
                onChange={(event) => set('number_id', Number(event.target.value))}
                className={`${fieldClass} mt-2`}
                aria-label="VIP number"
              >
                <option value="">{catalogLoading ? 'Loading numbers…' : 'Select a VIP number'}</option>
                {selected && !selectableCatalog.some((number) => number.number_id === selected.number_id) && (
                  <option value={selected.number_id}>{selected.display_number} — {formatINR(selected.offer_price)}</option>
                )}
                {selectableCatalog.map((number) => (
                  <option key={number.number_id} value={number.number_id}>
                    {number.display_number} — {formatINR(number.offer_price)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Hero label <span className="font-normal">(optional)</span></label>
              <input
                maxLength={64}
                value={form.hero_label || ''}
                onChange={(event) => set('hero_label', event.target.value)}
                placeholder="e.g. Numerology Special"
                className={fieldClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Hero description <span className="font-normal">(optional)</span></label>
              <textarea
                maxLength={160}
                rows={3}
                value={form.hero_description || ''}
                onChange={(event) => set('hero_description', event.target.value)}
                placeholder="e.g. Highly desirable • Easy to remember"
                className={fieldClass}
              />
            </div>

            <label className="flex min-h-11 items-center gap-3 rounded-xl border border-border bg-muted px-4 text-sm font-bold text-foreground">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => set('is_active', event.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Publish this number in the homepage hero
            </label>
          </div>

          <div className="deal-admin-preview relative overflow-hidden rounded-2xl border border-primary/25 bg-card p-5 shadow-lg">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
            <div className="text-center">
              <Crown className="mx-auto h-7 w-7 text-primary" />
              <div className="mt-3 text-xs font-black uppercase tracking-[.12em] text-primary">
                {form.hero_label || selected?.title_label || 'Premium Pick'}
              </div>
              <div className="mt-5 text-2xl font-black tracking-wide text-foreground">
                {selected?.display_number || '000000 0000'}
              </div>
              <div className="my-5 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              <p className="min-h-10 text-sm text-muted-foreground">
                {form.hero_description || 'Highly desirable • Easy to remember'}
              </p>
              <div className="mt-6 rounded-xl bg-primary/10 p-3">
                <div className="text-[10px] font-bold uppercase text-muted-foreground">Deal price</div>
                <div className="mt-1 text-xl font-black text-primary">{formatINR(selected?.offer_price || 0)}</div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-gold min-h-11 lg:col-span-2">
            {saving ? 'Saving…' : form.deal_id ? 'Update Deal' : 'Add to Deal of the Day'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
