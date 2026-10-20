import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, MessageCircle, Share2, PhoneCall, Zap, Crown, Heart, GitCompareArrows, ShoppingCart } from 'lucide-react';
import { numbersAPI, cartAPI, wishlistAPI, siteAPI } from '@/core/api/vnwAPI';
import { useStore } from '@/shared/store/useStore';
import { localService } from '@/core/services/local';
import { useToast } from '@/shared/hooks/use-toast';
import { formatINR, digitTotal, numerologySum } from '@/core/lib/format';
import { Loader } from '@/shared/components/ui-bits';
import { pushRecentlyViewed } from '@/core/lib/recentlyViewed';
import NumberCard from '@/shared/components/NumberCard';

import { formatNumberDisplay } from '@/core/categories/numberDisplay';
import './NumberDetail.css';
import CompactPageHeader from '@/shared/components/CompactPageHeader';
import { getNumberCategories, getPrimaryCategory } from '@/core/categories/types';
import { getNumberPurchaseMode, numberActionPath, numberReadinessLabel } from '@/core/lib/numberPurchaseMode';

export default function NumberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshCounts, site, compare, toggleCompare } = useStore();
  const [data, setData] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enq, setEnq] = useState({ name: '', phone: '' });
  const [enqBusy, setEnqBusy] = useState(false);

  const load = () => {
    setLoading(true);
    setRelated([]);
    numbersAPI.detail(Number(id)).then((d) => {
      setData(d);
      pushRecentlyViewed(d);
      numbersAPI.similar({ number_id: d.number_id, page: 1, limit: 4 })
        .then((response) => setRelated(response.items || []))
        .catch(() => setRelated([]));
    }).catch(() => setData(null)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); window.scrollTo(0, 0); /* eslint-disable-next-line */ }, [id]);

  const requireAuth = () => { if (!localService.getToken()) { navigate('/login'); return false; } return true; };

  const addToCart = async () => {
    if (!requireAuth()) return;
    try { await cartAPI.add(data.number_id); await refreshCounts(); toast({ title: 'Added to cart' }); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };
  const addWish = async () => {
    if (!requireAuth()) return;
    try { await wishlistAPI.add(data.number_id); await refreshCounts(); toast({ title: 'Added to wishlist' }); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: 'VIP Number ' + data.display_number, url });
      else { await navigator.clipboard.writeText(url); toast({ title: 'Link copied!' }); }
    } catch { /* cancelled */ }
  };
  const submitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault(); setEnqBusy(true);
    try {
      const res = await siteAPI.enquiry({ name: enq.name, phone: enq.phone, number_id: data.number_id, type: 'NUMBER_ENQUIRY', subject: `Enquiry: ${data.display_number}` });
      if (res?.status === 1) { setEnq({ name: '', phone: '' }); toast({ title: 'Request sent', description: res.info }); }
      else throw new Error(res?.info || 'Failed');
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setEnqBusy(false); }
  };

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-10"><Loader /></div>;
  if (!data) return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">Number not found. <Link to="/shop" className="text-primary">Back to shop</Link></div>;

  const purchaseMode = getNumberPurchaseMode(data);
  const sold = purchaseMode === 'UNAVAILABLE';
  const prebook = purchaseMode === 'PREBOOK';
  const wa = (site.WHATSAPP || '').replace(/\D/g, '');
  const waLink = `https://wa.me/${wa}?text=${encodeURIComponent(`Hi! I'm interested in VIP number ${data.display_number} (${formatINR(data.offer_price)}). Is it available?`)}`;

  const category = getPrimaryCategory(data);
  const number = data.number_value || data.display_number;

  return (
    <div className="commerce-page number-detail-page">
      <CompactPageHeader title="Number details" subtitle="A closer look at your next memorable number." icon={Crown} action={<div className="flex gap-2"><Link to="/shop" className="btn-gold-outline min-h-9 text-xs"><ArrowLeft className="h-3 w-3" />Store</Link><button onClick={share} className="btn-gold-outline min-h-9 text-xs"><Share2 className="h-3 w-3" />Share</button></div>} />
      <div className="number-detail-layout">
        <div className="number-detail-content">
          <section className="number-detail-identity">
            <div className="number-detail-identity__hero">
              <span className={`number-detail-status ${sold ? '' : 'is-available'}`}>{data.status}</span>
              {data.title_label?.trim() && <p className="number-detail-title"><Crown className="h-4 w-4" /><span>{data.title_label}</span></p>}
              <h2 className="number-detail-digits vnw-card-numeral" data-no-translate>{formatNumberDisplay(number, category)}</h2>
              <div className="number-detail-category">{category?.name || 'VIP number'}</div>
              <div className="number-detail-readiness"><ShieldCheck className="h-4 w-4" /><span>{numberReadinessLabel(data)}</span></div>
            </div>
            <dl className="number-detail-metrics">
              <div><dt>Total</dt><dd data-no-translate>{digitTotal(number)}</dd></div>
              <div><dt>Root sum</dt><dd data-no-translate>{numerologySum(number)}</dd></div>
            </dl>
          </section>
          <section className="commerce-panel number-detail-information">
            {getNumberCategories(data).length > 0 && (
              <div aria-label="Matching categories and subcategories">
                <h3 className="text-sm font-black text-foreground">Matching patterns</h3>
                <div className="number-detail-patterns">
                  {getNumberCategories(data).map((match) => (
                    <div key={match.slug} className="number-detail-pattern">
                      <Link to={`/shop?category=${encodeURIComponent(match.slug)}`} className="text-xs font-bold text-primary hover:underline">{match.name}</Link>
                      {Boolean(match.subcategories?.length) && <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1">
                        {match.subcategories!.map((sub) => <Link key={`${match.id}:${sub.id}`} to={`/shop?category=${encodeURIComponent(match.slug)}&subcategory_id=${sub.id}`} className="text-[11px] text-muted-foreground hover:text-primary hover:underline">{sub.name}</Link>)}
                      </div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="number-detail-trust">
              <span><ShieldCheck className="h-4 w-4" />100% genuine</span><span>Secure Cashfree payment</span><span>Quick transfer support</span>
            </div>
            {!prebook && !sold && <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-primary">{data.rtp_status === 'RTA' ? <Zap className="h-4 w-4 shrink-0" /> : <ShieldCheck className="h-4 w-4 shrink-0" />}{data.rtp_status === 'RTA' ? 'RTA · Ready to activate within minutes' : 'RTP · Ready to begin porting'}</p>}
          </section>
        </div>
        <aside className="number-detail-sidebar">
          <section className="commerce-panel number-detail-purchase">
            <div className="flex flex-wrap items-baseline justify-between gap-2"><strong className="text-3xl font-black text-primary" data-no-translate>{formatINR(data.offer_price)}</strong><del className="text-sm text-muted-foreground" data-no-translate>{formatINR(data.mrp)}</del></div>
            <p className="mt-1 text-xs font-semibold text-success">Save {formatINR(Math.max(0, Number(data.mrp) - Number(data.offer_price)))}</p>
            <p className="mt-2 text-xs text-muted-foreground">GST and coupons calculated at checkout.</p>
            <button disabled={sold} onClick={() => requireAuth() && navigate(numberActionPath(data))} className="btn-gold mt-4 min-h-11 w-full text-sm">{sold ? 'Unavailable' : prebook ? 'Pre-book this number' : 'Buy this number'}</button>
            <div className="mt-2 flex gap-2">{!prebook && <button disabled={sold} onClick={addToCart} className="btn-gold-outline min-h-10 flex-1 text-xs"><ShoppingCart className="h-4 w-4" />Cart</button>}<button onClick={addWish} aria-label="Save to wishlist" className="btn-gold-outline min-h-10 px-3"><Heart className="h-4 w-4" /></button><button onClick={() => toggleCompare(data.number_id)} aria-label="Compare this number" aria-pressed={compare.includes(data.number_id)} className="btn-gold-outline min-h-10 px-3"><GitCompareArrows className="h-4 w-4" /></button></div>
          </section>
          <section className="commerce-panel number-detail-contact">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-black"><PhoneCall className="h-4 w-4 text-primary" />Request a Callback</h2>
            <form onSubmit={submitEnquiry} className="space-y-2.5">
              <input aria-label="Your name" autoComplete="name" required placeholder="Your name" value={enq.name} onChange={(e) => setEnq({ ...enq, name: e.target.value })} className="input-luxury w-full" />
              <input aria-label="Phone" autoComplete="tel" type="tel" required placeholder="Phone" value={enq.phone} onChange={(e) => setEnq({ ...enq, phone: e.target.value })} className="input-luxury w-full" />
              <button disabled={enqBusy} className="btn-royal min-h-11 w-full">{enqBusy ? 'Sending...' : 'Call Me'}</button>
            </form>
            {wa && <a className="number-detail-whatsapp" href={waLink} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4 shrink-0" />WhatsApp Enquiry</a>}
          </section>
        </aside>
      </div>
      {related.length > 0 && (
        <section className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-base font-black text-foreground">Similar Numbers</h2><p className="mt-1 text-sm text-muted-foreground">Ranked by pattern, category, numerology, and price closeness.</p></div>
            <Link to={`/number/${data.number_id}/similar`} className="btn-gold-outline">View all similar numbers</Link>
          </div>
          <div className="number-card-grid">{related.map((n) => <NumberCard key={n.number_id} item={n} />)}</div>
        </section>
      )}
    </div>
  );
}
