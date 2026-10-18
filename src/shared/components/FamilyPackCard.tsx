import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, CheckCheck, Crown, RotateCcw, ShoppingCart, Zap } from 'lucide-react';
import { cartAPI, type CorporatePack } from '@/core/api/vnwAPI';
import { formatINR } from '@/core/lib/format';
import { formatNumberDisplay } from '@/core/categories/numberDisplay';
import { getPrimaryCategory } from '@/core/categories/types';
import './NumberCard.css';
import './FamilyPackCard.css';
import { localService } from '@/core/services/local';
import { useStore } from '@/shared/store/useStore';
import { useToast } from '@/shared/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';

const PACK_LABELS: Record<CorporatePack['pack_type'], string> = {
  SERIES: 'Numbers in Series',
  MIXED: 'All Mixed',
  SIMILAR_START: 'Similar Start',
  SIMILAR_END: 'Similar End',
  SIMILAR_BOTH: 'Similar Both Ends',
};

export default function FamilyPackCard({ pack, compact = false }: {
  pack: CorporatePack;
  compact?: boolean;
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
    <article className={`reference-card reference-family${compact ? ' reference-family--compact' : ''}`} data-testid="family-pack-card">
      <header className="reference-family__header">
        <div className="reference-family__heading">
          <div className="reference-family__badge"><Crown aria-hidden="true" />{PACK_LABELS[pack.pack_type]}</div>
          <span className="reference-family__size" aria-label={`${pack.size} numbers in this pack`}>
            <strong>{pack.size}</strong><span>numbers</span>
          </span>
        </div>
      </header>

      <div className="reference-family__numbers">
        {pack.numbers.map((number) => {
          const selected = selectedIds.has(number.number_id);
          const display = formatNumberDisplay(number.display_number, getPrimaryCategory(number));
          return (
            <div key={number.number_id} className={`reference-family__row${selected ? ' is-selected' : ''}`}>
              <button type="button" onClick={() => toggleSelected(number.number_id)} disabled={activeAction !== null}
                aria-label={`${selected ? 'Deselect' : 'Select'} ${number.display_number}`} aria-pressed={selected}
                className="reference-family__select"><Check aria-hidden="true" /></button>
              <Link to={`/number/${number.number_id}`} className="reference-family__number-link">
                <span className="reference-family__number">{display}</span>
              </Link>
              <span className="reference-family__price">{formatINR(number.offer_price)}</span>
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
          <TooltipProvider delayDuration={250}><Tooltip><TooltipTrigger asChild>
            <button type="button" disabled={activeAction !== null} aria-label={allSelected ? 'Clear selection' : 'Select all'}
              onClick={() => setSelectedIds(allSelected ? new Set() : new Set(pack.numbers.map((number) => number.number_id)))}
              className="reference-family__clear">{allSelected ? <RotateCcw aria-hidden="true" /> : <CheckCheck aria-hidden="true" />}</button>
          </TooltipTrigger><TooltipContent side="top">{allSelected ? 'Clear selection' : 'Select all'}</TooltipContent></Tooltip></TooltipProvider>
        </div>
        <div className="reference-family__batch-actions">
          <button type="button" onClick={() => addSelected(false)} disabled={!selectedNumbers.length || !pack.is_available || activeAction !== null}
            aria-busy={activeAction === 'cart-selected'} className="reference-family__cart">
            <ShoppingCart aria-hidden="true" /><span>{activeAction === 'cart-selected' ? 'Adding…' : 'Add to Cart'}</span>
          </button>
          <button type="button" onClick={() => addSelected(true)} disabled={!selectedNumbers.length || !pack.is_available || activeAction !== null}
            aria-busy={activeAction === 'buy-selected'} className="reference-family__buy">
            <Zap aria-hidden="true" /><span>{activeAction === 'buy-selected' ? 'Preparing…' : 'Buy Now'}</span>
          </button>
        </div>
      </footer>
    </article>
  );
}
