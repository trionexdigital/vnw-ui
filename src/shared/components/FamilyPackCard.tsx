import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Check, Heart, ShoppingCart, Zap } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cartAPI, wishlistAPI, type CorporatePack } from '@/core/api/vnwAPI';
import { formatINR } from '@/core/lib/format';
import { localService } from '@/core/services/local';
import { useStore } from '@/shared/store/useStore';
import { useToast } from '@/shared/hooks/use-toast';

const PACK_LABELS: Record<CorporatePack['pack_type'], string> = {
  SERIES: 'Numbers in Series',
  MIXED: 'All Mixed',
  SIMILAR_START: 'Similar Start',
  SIMILAR_END: 'Similar End',
  SIMILAR_BOTH: 'Similar Both Ends',
};

export function useFamilyPackWishlist() {
  const [wishedIds, setWishedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let active = true;
    if (!localService.getToken()) return () => { active = false; };
    wishlistAPI.list()
      .then((data: any) => {
        if (active) setWishedIds(new Set((data?.items || []).map((item: any) => Number(item.number_id))));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const updateWishlist = (numberId: number, wished: boolean) => {
    setWishedIds((current) => {
      const next = new Set(current);
      if (wished) next.add(numberId); else next.delete(numberId);
      return next;
    });
  };

  return { wishedIds, updateWishlist };
}

export default function FamilyPackCard({ pack, wishedIds, onWishlistChange }: {
  pack: CorporatePack;
  wishedIds: Set<number>;
  onWishlistChange: (numberId: number, wished: boolean) => void;
}) {
  const navigate = useNavigate();
  const { refreshCounts } = useStore();
  const { toast } = useToast();
  const reduceMotion = useReducedMotion();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set(pack.numbers.map((number) => number.number_id)));
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const requireAuth = () => {
    if (localService.getToken()) return true;
    navigate('/login');
    return false;
  };

  const toggleSelected = (numberId: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(numberId)) next.delete(numberId); else next.add(numberId);
      return next;
    });
  };

  const selectedNumbers = pack.numbers.filter((number) => selectedIds.has(number.number_id));
  const selectedTotal = selectedNumbers.reduce((total, number) => total + Number(number.offer_price || 0), 0);
  const allSelected = selectedIds.size === pack.numbers.length;

  const addOne = async (number: CorporatePack['numbers'][number]) => {
    if (!requireAuth()) return;
    setActiveAction(`cart-${number.number_id}`);
    try {
      await cartAPI.add(number.number_id);
      await refreshCounts();
      toast({ title: 'Added to cart', description: number.display_number });
    } catch (error: any) {
      toast({ title: 'Could not add number', description: error.message, variant: 'destructive' });
    } finally { setActiveAction(null); }
  };

  const buyOne = (number: CorporatePack['numbers'][number]) => {
    if (!requireAuth()) return;
    navigate(`/checkout?number_id=${number.number_id}`);
  };

  const toggleWishlist = async (number: CorporatePack['numbers'][number]) => {
    if (!requireAuth()) return;
    const wished = wishedIds.has(number.number_id);
    setActiveAction(`wish-${number.number_id}`);
    try {
      if (wished) await wishlistAPI.remove(number.number_id);
      else await wishlistAPI.add(number.number_id);
      onWishlistChange(number.number_id, !wished);
      await refreshCounts();
      toast({ title: wished ? 'Removed from wishlist' : 'Saved to wishlist', description: number.display_number });
    } catch (error: any) {
      toast({ title: 'Could not update wishlist', description: error.message, variant: 'destructive' });
    } finally { setActiveAction(null); }
  };

  const addSelected = async (checkout: boolean) => {
    if (!selectedNumbers.length || !requireAuth()) return;
    setActiveAction(checkout ? 'buy-selected' : 'cart-selected');
    try {
      await cartAPI.addMany(selectedNumbers.map((number) => number.number_id));
      await refreshCounts();
      toast({
        title: checkout ? 'Selected numbers ready' : 'Selected numbers added',
        description: `${selectedNumbers.length} VIP ${selectedNumbers.length === 1 ? 'number is' : 'numbers are'} ready in your cart.`,
      });
      navigate(checkout ? '/checkout' : '/cart');
    } catch (error: any) {
      toast({ title: 'Selected numbers could not be added', description: error.message, variant: 'destructive' });
    } finally { setActiveAction(null); }
  };

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 14, scale: .985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: .12 }}
      whileHover={reduceMotion ? undefined : { y: -5, scale: 1.004 }}
      transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 230, damping: 24 }}
      className="relative overflow-hidden rounded-2xl border border-primary/25 bg-card p-3 shadow-[0_8px_26px_hsl(var(--foreground)/.055)] transition-shadow duration-300 hover:shadow-[0_18px_46px_hsl(var(--primary)/.13)]"
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />
      <span className="pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 h-28 w-12 -skew-x-12 bg-gradient-to-r from-transparent via-primary/10 to-transparent blur-sm"
        initial={{ left: '-18%' }}
        animate={reduceMotion ? undefined : { left: ['-18%', '118%'] }}
        transition={reduceMotion ? undefined : { duration: 6.5, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-primary">
            <Building2 className="h-3 w-3" /> {PACK_LABELS[pack.pack_type]}
          </div>
          <h3 className="mt-1.5 text-base font-black text-foreground">{pack.title}</h3>
        </div>
        <motion.span whileHover={reduceMotion ? undefined : { rotate: 5, scale: 1.08 }} className="grid h-9 min-w-9 place-items-center rounded-lg border border-border bg-muted text-xs font-black text-primary">{pack.size}</motion.span>
      </div>
      {pack.description && <p className="relative mt-1 line-clamp-1 text-xs leading-5 text-muted-foreground">{pack.description}</p>}

      <div className="relative mt-2.5 grid gap-2 sm:grid-cols-2">
        {pack.numbers.map((number, index) => {
          const selected = selectedIds.has(number.number_id);
          const wished = wishedIds.has(number.number_id);
          return (
            <motion.div
              key={number.number_id}
              layout
              initial={reduceMotion ? false : { opacity: 0, y: 9, scale: .97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              whileHover={reduceMotion ? undefined : { y: -3, scale: 1.015, rotate: index % 2 ? .18 : -.18 }}
              whileTap={reduceMotion ? undefined : { scale: .985 }}
              transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 310, damping: 24, delay: index * .025 }}
              className={`group/number relative overflow-hidden rounded-xl border p-2 transition-all duration-300 ${selected ? 'border-primary/60 bg-primary/[.07] shadow-[0_6px_18px_hsl(var(--primary)/.10)]' : 'border-border bg-background hover:border-primary/45'}`}
            >
              <motion.span aria-hidden="true" initial={false} animate={{ opacity: selected ? 1 : 0, scale: selected ? 1 : .88 }} transition={{ duration: reduceMotion ? 0 : .22 }} className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-primary/25" />
              <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-0 transition-all duration-700 group-hover/number:left-[120%] group-hover/number:opacity-100" />
              <div className="relative flex items-center justify-between gap-2">
                <motion.button whileTap={reduceMotion ? undefined : { scale: .82, rotate: -8 }} type="button" onClick={() => toggleSelected(number.number_id)} aria-label={`${selected ? 'Deselect' : 'Select'} ${number.display_number}`} aria-pressed={selected} className={`grid h-6 w-6 place-items-center rounded-md border transition-all duration-300 ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary hover:text-primary'}`}>
                  <Check className={`h-3 w-3 transition-all duration-300 ${selected ? 'scale-100 rotate-0 opacity-100' : 'scale-50 -rotate-45 opacity-25'}`} />
                </motion.button>
                <motion.button whileHover={reduceMotion ? undefined : { scale: 1.12, rotate: wished ? -6 : 6 }} whileTap={reduceMotion ? undefined : { scale: .82 }} type="button" onClick={() => toggleWishlist(number)} disabled={activeAction === `wish-${number.number_id}`} aria-label={`${wished ? 'Remove' : 'Add'} ${number.display_number} ${wished ? 'from' : 'to'} wishlist`} aria-pressed={wished} className={`grid h-7 w-7 place-items-center rounded-lg border bg-card transition-colors ${wished ? 'border-primary/50 text-primary' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}`}>
                  <Heart className="h-3.5 w-3.5" fill={wished ? 'currentColor' : 'none'} />
                </motion.button>
              </div>
              <Link to={`/number/${number.number_id}`} className="relative mt-0.5 block rounded-lg px-0.5 py-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <span className="block text-[8px] font-black uppercase tracking-[.12em] text-primary">VIP Number</span>
                <span className="mt-0.5 block text-base font-black tracking-wide text-foreground transition-colors duration-300 group-hover/number:text-primary">{number.display_number}</span>
                <span className="mt-0.5 block text-xs font-black text-foreground">{formatINR(number.offer_price)}</span>
              </Link>
              <div className="relative mt-1 grid grid-cols-[1fr_auto] gap-1.5">
                <motion.button whileHover={reduceMotion ? undefined : { y: -1, scale: 1.02 }} whileTap={reduceMotion ? undefined : { scale: .96 }} type="button" onClick={() => buyOne(number)} disabled={!pack.is_available} className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-primary px-2 text-[10px] font-black text-primary-foreground shadow-sm transition-colors hover:brightness-105 disabled:opacity-50">
                  <Zap className="h-3 w-3" /> Buy Now
                </motion.button>
                <motion.button whileHover={reduceMotion ? undefined : { y: -1, scale: 1.07 }} whileTap={reduceMotion ? undefined : { scale: .9 }} type="button" onClick={() => addOne(number)} disabled={!pack.is_available || activeAction === `cart-${number.number_id}`} aria-label={`Add ${number.display_number} to cart`} className="grid h-8 w-9 place-items-center rounded-lg border border-primary/30 bg-card text-primary shadow-sm transition-colors hover:border-primary hover:bg-primary/10 disabled:opacity-50">
                  <ShoppingCart className="h-3.5 w-3.5" />
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="relative mt-2.5 rounded-xl border border-border bg-background/80 p-2.5 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{selectedNumbers.length} of {pack.size} selected</div>
            <motion.div key={selectedTotal} initial={reduceMotion ? false : { opacity: .4, y: 3 }} animate={{ opacity: 1, y: 0 }} className="text-base font-black text-foreground">{formatINR(selectedNumbers.length ? selectedTotal : 0)}</motion.div>
          </div>
          <motion.button whileTap={reduceMotion ? undefined : { scale: .94 }} type="button" onClick={() => setSelectedIds(allSelected ? new Set() : new Set(pack.numbers.map((number) => number.number_id)))} className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-[10px] font-black text-foreground transition-colors hover:border-primary hover:text-primary">
            {allSelected ? 'Clear selection' : 'Select all'}
          </motion.button>
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          <motion.button whileHover={reduceMotion ? undefined : { y: -1 }} whileTap={reduceMotion ? undefined : { scale: .97 }} type="button" onClick={() => addSelected(false)} disabled={!selectedNumbers.length || !pack.is_available || activeAction !== null} className="btn-gold-outline min-h-9 text-[10px] disabled:cursor-not-allowed disabled:opacity-50">
            <ShoppingCart className="h-3.5 w-3.5" /> {activeAction === 'cart-selected' ? 'Adding…' : 'Add selected to cart'}
          </motion.button>
          <motion.button whileHover={reduceMotion ? undefined : { y: -1, scale: 1.01 }} whileTap={reduceMotion ? undefined : { scale: .97 }} type="button" onClick={() => addSelected(true)} disabled={!selectedNumbers.length || !pack.is_available || activeAction !== null} className="btn-gold min-h-9 text-[10px] disabled:cursor-not-allowed disabled:opacity-50">
            <Zap className="h-3.5 w-3.5" /> {activeAction === 'buy-selected' ? 'Preparing…' : 'Buy selected'}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
