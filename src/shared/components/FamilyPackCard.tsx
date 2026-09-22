import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Crown, Heart, ShoppingCart, Zap } from 'lucide-react';
import { cartAPI, wishlistAPI, type CorporatePack } from '@/core/api/vnwAPI';
import { formatINR } from '@/core/lib/format';
import { normalizeNumberDigits } from '@/core/categories/highlight';
import './NumberCard.css';
import './FamilyPackCard.css';
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
    if (activeAction !== null || !requireAuth()) return;
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
    if (activeAction !== null || !requireAuth()) return;
    navigate(`/checkout?number_id=${number.number_id}`);
  };

  const toggleWishlist = async (number: CorporatePack['numbers'][number]) => {
    if (activeAction !== null || !requireAuth()) return;
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
    if (!selectedNumbers.length || !pack.is_available || activeAction !== null || !requireAuth()) return;
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
    <article className="reference-card reference-family" data-testid="family-pack-card">
      <header className="reference-family__header">
        <div className="reference-family__heading">
          <div className="reference-family__badge"><Crown aria-hidden="true" />{PACK_LABELS[pack.pack_type]}</div>
          <span className="reference-family__size" aria-label={`${pack.size} numbers in this pack`}>
            <strong>{pack.size}</strong><span>numbers</span>
          </span>
          <h3>{pack.title}</h3>
        </div>
        {pack.description && <p className="reference-family__description">{pack.description}</p>}
      </header>

      <div className="reference-family__numbers">
        {pack.numbers.map((number) => {
          const selected = selectedIds.has(number.number_id);
          const wished = wishedIds.has(number.number_id);
          const digits = normalizeNumberDigits(number.display_number);
          const display = digits.length === 10 ? `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}` : number.display_number;
          const unavailable = !pack.is_available || number.status !== 'AVAILABLE' || Number(number.stock) <= 0;
          return (
            <div key={number.number_id} className={`reference-family__row${selected ? ' is-selected' : ''}`}>
              <button type="button" onClick={() => toggleSelected(number.number_id)} disabled={activeAction !== null}
                aria-label={`${selected ? 'Deselect' : 'Select'} ${number.display_number}`} aria-pressed={selected}
                className="reference-family__select"><Check aria-hidden="true" /></button>
              <Link to={`/number/${number.number_id}`} className="reference-family__number-link">
                <span className="reference-family__number-label">VIP Number</span>
                <span className="reference-family__number">{display}</span>
                <span className="reference-family__price">{formatINR(number.offer_price)}</span>
              </Link>
              <button type="button" onClick={() => toggleWishlist(number)} disabled={activeAction !== null}
                aria-busy={activeAction === `wish-${number.number_id}`}
                aria-label={`${wished ? 'Remove' : 'Add'} ${number.display_number} ${wished ? 'from' : 'to'} wishlist`}
                aria-pressed={wished} className={`reference-family__wish${wished ? ' is-wished' : ''}`}>
                <Heart aria-hidden="true" fill={wished ? 'currentColor' : 'none'} />
              </button>
              <div className="reference-family__row-actions">
                <button type="button" onClick={() => buyOne(number)} disabled={unavailable || activeAction !== null} className="reference-family__buy">
                  <Zap aria-hidden="true" /><span>{unavailable ? 'Unavailable' : 'Buy Now'}</span>
                </button>
                <button type="button" onClick={() => addOne(number)} disabled={unavailable || activeAction !== null}
                  aria-label={`Add ${number.display_number} to cart`} aria-busy={activeAction === `cart-${number.number_id}`} className="reference-family__cart">
                  <ShoppingCart aria-hidden="true" /><span>{activeAction === `cart-${number.number_id}` ? 'Adding…' : 'Add to Cart'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <footer className="reference-family__summary">
        <div className="reference-family__selection">
          <div role="status" aria-live="polite" aria-atomic="true">
            <div className="reference-family__selected-count">{selectedNumbers.length} of {pack.size} selected</div>
            <div className="reference-family__total">{formatINR(selectedTotal)}</div>
          </div>
          <button type="button" disabled={activeAction !== null}
            onClick={() => setSelectedIds(allSelected ? new Set() : new Set(pack.numbers.map((number) => number.number_id)))}
            className="reference-family__clear">{allSelected ? 'Clear selection' : 'Select all'}</button>
        </div>
        <div className="reference-family__batch-actions">
          <button type="button" onClick={() => addSelected(false)} disabled={!selectedNumbers.length || !pack.is_available || activeAction !== null}
            aria-busy={activeAction === 'cart-selected'} className="reference-family__cart">
            <ShoppingCart aria-hidden="true" /><span>{activeAction === 'cart-selected' ? 'Adding…' : 'Add selected to cart'}</span>
          </button>
          <button type="button" onClick={() => addSelected(true)} disabled={!selectedNumbers.length || !pack.is_available || activeAction !== null}
            aria-busy={activeAction === 'buy-selected'} className="reference-family__buy">
            <Zap aria-hidden="true" /><span>{activeAction === 'buy-selected' ? 'Preparing…' : 'Buy selected'}</span>
          </button>
        </div>
      </footer>
    </article>
  );
}
