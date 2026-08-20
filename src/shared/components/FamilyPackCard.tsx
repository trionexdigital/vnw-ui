import { useEffect, useState, type PointerEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Crown, Heart, ShoppingCart, Zap } from 'lucide-react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
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
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rotateX = useSpring(rawRotateX, { stiffness: 260, damping: 24, mass: .72 });
  const rotateY = useSpring(rawRotateY, { stiffness: 260, damping: 24, mass: .72 });
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

  const moveCard = (event: PointerEvent<HTMLElement>) => {
    if (reduceMotion || event.pointerType === 'touch') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    rawRotateX.set((.5 - y) * 5);
    rawRotateY.set((x - .5) * 5);
    event.currentTarget.style.setProperty('--card-pointer-x', `${Math.round(x * 100)}%`);
    event.currentTarget.style.setProperty('--card-pointer-y', `${Math.round(y * 100)}%`);
  };

  const resetCard = (event: PointerEvent<HTMLElement>) => {
    rawRotateX.set(0);
    rawRotateY.set(0);
    event.currentTarget.style.setProperty('--card-pointer-x', '50%');
    event.currentTarget.style.setProperty('--card-pointer-y', '30%');
  };

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
      whileHover={reduceMotion ? undefined : { y: -6, scale: 1.01 }}
      whileTap={reduceMotion ? undefined : { scale: .992 }}
      transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 24, mass: .72 }}
      onPointerMove={moveCard}
      onPointerLeave={resetCard}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className="number-card-shell family-pack-card group relative h-full w-full min-w-0 overflow-hidden rounded-[1.35rem] p-2.5"
      data-testid="family-pack-card"
    >
      <span className="number-card__glow" aria-hidden="true" />
      <span className="number-card__topline" aria-hidden="true" />
      <span className="number-card__corner number-card__corner--left" aria-hidden="true" />
      <span className="number-card__corner number-card__corner--right" aria-hidden="true" />

      <div className="family-pack-card__header relative z-10 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <div className="min-w-0">
          <div className="number-card__badge number-card__badge--default inline-flex min-h-6 items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wide">
            <Crown className="h-3 w-3" /> {PACK_LABELS[pack.pack_type]}
          </div>
          <h3 className="family-pack-card__title mt-1.5 min-h-8 break-words text-sm font-black leading-4">{pack.title}</h3>
        </div>
        <motion.span whileHover={reduceMotion ? undefined : { rotate: 5, scale: 1.08 }} className="family-pack-card__size grid h-9 min-w-9 place-items-center rounded-xl border px-1 text-sm font-black" aria-label={`${pack.size} numbers in this pack`}>{pack.size}</motion.span>
      </div>
      <p className="family-pack-card__description relative z-10 mt-1 min-h-7 text-[10px] leading-3.5 text-muted-foreground">{pack.description || '\u00a0'}</p>

      <div className="family-pack-card__number-list relative z-10 mt-2 space-y-1.5">
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
              className={`family-pack-card__number-row group/number relative min-h-[3.5rem] overflow-hidden rounded-xl border px-1.5 py-1.5 transition-all duration-300 ${selected ? 'is-selected' : ''}`}
            >
              <motion.span aria-hidden="true" initial={false} animate={{ opacity: selected ? 1 : 0, scale: selected ? 1 : .88 }} transition={{ duration: reduceMotion ? 0 : .22 }} className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-primary/25" />
              <div className="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5">
                <motion.button whileTap={reduceMotion ? undefined : { scale: .82, rotate: -8 }} type="button" onClick={() => toggleSelected(number.number_id)} aria-label={`${selected ? 'Deselect' : 'Select'} ${number.display_number}`} aria-pressed={selected} className={`family-pack-card__select grid h-7 w-7 place-items-center rounded-full border transition-all duration-300 ${selected ? 'is-selected' : ''}`}>
                  <Check className={`h-3.5 w-3.5 transition-all duration-300 ${selected ? 'scale-100 rotate-0 opacity-100' : 'scale-50 -rotate-45 opacity-25'}`} />
                </motion.button>
                <Link to={`/number/${number.number_id}`} className="min-w-0 rounded-md px-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <span className="block text-[7px] font-black uppercase tracking-[.11em] text-primary">VIP Number</span>
                  <span className="family-pack-card__number block whitespace-nowrap text-sm font-black tracking-[.025em]">{number.display_number}</span>
                  <span className="family-pack-card__price block whitespace-nowrap text-[10px] font-black">{formatINR(number.offer_price)}</span>
                </Link>
                <div className="family-pack-card__number-actions flex shrink-0 items-center gap-1">
                  <motion.button whileHover={reduceMotion ? undefined : { scale: 1.1, rotate: wished ? -5 : 5 }} whileTap={reduceMotion ? undefined : { scale: .84 }} type="button" onClick={() => toggleWishlist(number)} disabled={activeAction === `wish-${number.number_id}`} aria-label={`${wished ? 'Remove' : 'Add'} ${number.display_number} ${wished ? 'from' : 'to'} wishlist`} aria-pressed={wished} className={`number-card__secondary-action grid h-7 w-7 place-items-center rounded-lg border ${wished ? 'is-active' : ''}`}>
                    <Heart className="h-3.5 w-3.5" fill={wished ? 'currentColor' : 'none'} />
                  </motion.button>
                  <motion.button whileHover={reduceMotion ? undefined : { y: -1, scale: 1.02 }} whileTap={reduceMotion ? undefined : { scale: .95 }} type="button" onClick={() => buyOne(number)} disabled={!pack.is_available} className="number-card__primary-action inline-flex h-7 items-center justify-center gap-0.5 whitespace-nowrap rounded-lg px-1.5 text-[8px] font-black disabled:opacity-50">
                    <Zap className="h-3 w-3" /> Buy Now
                  </motion.button>
                  <motion.button whileHover={reduceMotion ? undefined : { y: -1, scale: 1.07 }} whileTap={reduceMotion ? undefined : { scale: .9 }} type="button" onClick={() => addOne(number)} disabled={!pack.is_available || activeAction === `cart-${number.number_id}`} aria-label={`Add ${number.display_number} to cart`} className="number-card__secondary-action grid h-7 w-7 place-items-center rounded-lg border disabled:opacity-50">
                    <ShoppingCart className="h-3 w-3" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="family-pack-card__summary relative z-10 mt-2 rounded-xl border p-2 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">{selectedNumbers.length} of {pack.size} selected</div>
            <motion.div key={selectedTotal} initial={reduceMotion ? false : { opacity: .4, y: 3 }} animate={{ opacity: 1, y: 0 }} className="family-pack-card__total text-base font-black">{formatINR(selectedNumbers.length ? selectedTotal : 0)}</motion.div>
          </div>
          <motion.button whileTap={reduceMotion ? undefined : { scale: .94 }} type="button" onClick={() => setSelectedIds(allSelected ? new Set() : new Set(pack.numbers.map((number) => number.number_id)))} className="number-card__secondary-action rounded-lg border px-2 py-1 text-[9px] font-black">
            {allSelected ? 'Clear selection' : 'Select all'}
          </motion.button>
        </div>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          <motion.button whileHover={reduceMotion ? undefined : { y: -1 }} whileTap={reduceMotion ? undefined : { scale: .97 }} type="button" onClick={() => addSelected(false)} disabled={!selectedNumbers.length || !pack.is_available || activeAction !== null} className="number-card__secondary-action inline-flex min-h-8 items-center justify-center gap-1 whitespace-nowrap rounded-lg border px-1 text-[8px] font-black disabled:cursor-not-allowed disabled:opacity-50">
            <ShoppingCart className="h-3.5 w-3.5" /> {activeAction === 'cart-selected' ? 'Adding…' : 'Add selected to cart'}
          </motion.button>
          <motion.button whileHover={reduceMotion ? undefined : { y: -1, scale: 1.01 }} whileTap={reduceMotion ? undefined : { scale: .97 }} type="button" onClick={() => addSelected(true)} disabled={!selectedNumbers.length || !pack.is_available || activeAction !== null} className="number-card__primary-action inline-flex min-h-8 items-center justify-center gap-1 whitespace-nowrap rounded-lg px-1 text-[8px] font-black disabled:cursor-not-allowed disabled:opacity-50">
            <Zap className="h-3.5 w-3.5" /> {activeAction === 'buy-selected' ? 'Preparing…' : 'Buy selected'}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
