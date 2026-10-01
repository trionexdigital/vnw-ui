import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, ShieldCheck, ArrowLeft, MessageCircle, Share2, PhoneCall, Zap, Crown, Heart, GitCompareArrows, ShoppingCart } from 'lucide-react';
import { numbersAPI, cartAPI, wishlistAPI, reviewsAPI, siteAPI } from '@/core/api/vnwAPI';
import { useStore } from '@/shared/store/useStore';
import { localService } from '@/core/services/local';
import { useToast } from '@/shared/hooks/use-toast';
import { formatINR } from '@/core/lib/format';
import { Loader } from '@/shared/components/ui-bits';
import { pushRecentlyViewed } from '@/core/lib/recentlyViewed';
import NumberCard from '@/shared/components/NumberCard';
import { cn } from '@/core/lib/utils';
import CompactPageHeader from '@/shared/components/CompactPageHeader';
import { getNumberCategories, getPrimaryCategory } from '@/core/categories/types';
import { formatRtpDate, getNumberPurchaseMode, numberActionPath, numberReadinessLabel } from '@/core/lib/numberPurchaseMode';

export default function NumberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshCounts, site, compare, toggleCompare } = useStore();
  const [data, setData] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
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
  const submitReview = async () => {
    if (!requireAuth()) return;
    try { await reviewsAPI.create({ number_id: data.number_id, rating, comment }); setComment(''); toast({ title: 'Review submitted' }); load(); }
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

  return (
    <div className="commerce-page number-detail-page">
      <CompactPageHeader title="Number details" subtitle="A closer look at your next memorable number." icon={Crown} action={<div className="flex gap-2"><Link to="/shop" className="btn-gold-outline min-h-9 text-xs"><ArrowLeft className="h-3 w-3" />Store</Link><button onClick={share} className="btn-gold-outline min-h-9 text-xs"><Share2 className="h-3 w-3" />Share</button></div>} />
      <section className="commerce-panel grid gap-4 bg-gradient-to-br from-card to-primary/5 sm:grid-cols-[1fr_300px] sm:items-center">
        <div><span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-black uppercase text-primary"><Crown className="h-3 w-3" />{getPrimaryCategory(data)?.name || 'VIP number'}</span><h2 className="my-3 break-words text-3xl font-black tracking-tight sm:text-4xl">{data.display_number}</h2><p className="text-xs text-muted-foreground">{data.title_label || 'Your number. Your identity.'}</p><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-lg bg-muted px-2 py-1 text-xs font-semibold">{numberReadinessLabel(data)}</span><span className={`rounded-lg px-2 py-1 text-xs font-bold ${sold ? 'bg-muted text-muted-foreground' : 'bg-success-soft text-success'}`}>{data.status}</span></div></div>
        <div className="rounded-xl border border-border bg-background p-4"><div className="flex items-baseline justify-between"><strong className="text-2xl text-primary">{formatINR(data.offer_price)}</strong><del className="text-xs text-muted-foreground">{formatINR(data.mrp)}</del></div><p className="mt-1 text-xs text-success">Save {formatINR(Math.max(0, Number(data.mrp) - Number(data.offer_price)))}</p><p className="mt-1 text-[10px] text-muted-foreground">GST and coupons calculated at checkout.</p><button disabled={sold} onClick={() => requireAuth() && navigate(numberActionPath(data))} className="btn-gold mt-3 w-full min-h-10 text-sm">{sold ? 'Unavailable' : prebook ? 'Pre-book this number' : 'Buy this number'}</button><div className="mt-2 flex gap-2">{!prebook && <button disabled={sold} onClick={addToCart} className="btn-gold-outline min-h-9 flex-1 text-xs"><ShoppingCart className="h-3 w-3" />Cart</button>}<button onClick={addWish} aria-label="Save to wishlist" className="btn-gold-outline min-h-9 px-3"><Heart className="h-4 w-4" /></button><button onClick={() => toggleCompare(data.number_id)} aria-label="Compare this number" aria-pressed={compare.includes(data.number_id)} className="btn-gold-outline min-h-9 px-3"><GitCompareArrows className="h-4 w-4" /></button></div></div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="commerce-panel">
          <h2 className="text-base font-black text-foreground">Number Details</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{data.description || 'A premium VIP number, with support through booking and ownership transfer.'}</p>
          {getNumberCategories(data).length > 0 && (
            <div className="mt-5" aria-label="Matching categories and subcategories">
              <h3 className="text-sm font-black text-foreground">Matching patterns</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {getNumberCategories(data).map((category) => (
                  <div key={category.slug} className="rounded-xl border border-border bg-muted/40 px-3 py-2">
                    <Link to={`/shop?category=${encodeURIComponent(category.slug)}`} className="text-xs font-bold text-primary hover:underline">{category.name}</Link>
                    {Boolean(category.subcategories?.length) && <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1">
                      {category.subcategories!.map((sub) => <Link key={`${category.id}:${sub.id}`} to={`/shop?category=${encodeURIComponent(category.slug)}&subcategory_id=${sub.id}`} className="text-[11px] text-muted-foreground hover:text-primary hover:underline">{sub.name}</Link>)}
                    </div>}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-3 text-xs font-bold text-muted-foreground">
            <span className="rounded-2xl bg-muted px-4 py-2"><ShieldCheck className="mr-1 inline h-4 w-4 text-primary" /> 100% genuine</span>
            <span className="rounded-2xl bg-muted px-4 py-2">Secure Cashfree payment</span>
            <span className="rounded-2xl bg-muted px-4 py-2">Quick transfer support</span>
            {!prebook && !sold && data.rtp_status === 'RTA' && <span className="rounded-2xl bg-success-soft px-4 py-2 text-success"><Zap className="mr-1 inline h-4 w-4" /> RTA · Ready to activate within minutes</span>}
            {!prebook && !sold && data.rtp_status !== 'RTA' && <span className="rounded-2xl bg-blue-500/10 px-4 py-2 text-blue-700"><ShieldCheck className="mr-1 inline h-4 w-4" /> RTP · Ready to begin porting</span>}
          </div>
          {wa && <a className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3 font-black text-white transition-all hover:brightness-105" href={waLink} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp Enquiry</a>}
        </div>

        <form onSubmit={submitEnquiry} className="commerce-panel h-fit">
          <div className="mb-4 flex items-center gap-2 text-sm font-black text-foreground"><PhoneCall className="h-4 w-4 text-primary" /> Request a Callback</div>
          <div className="space-y-3">
            <input aria-label="Your name" required placeholder="Your name" value={enq.name} onChange={(e) => setEnq({ ...enq, name: e.target.value })} className="input-luxury w-full" />
            <input aria-label="Phone" type="tel" required placeholder="Phone" value={enq.phone} onChange={(e) => setEnq({ ...enq, phone: e.target.value })} className="input-luxury w-full" />
            <button disabled={enqBusy} className="btn-royal w-full">{enqBusy ? 'Sending...' : 'Call Me'}</button>
          </div>
        </form>
      </div>

      {related.length > 0 && (
        <div className="mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-base font-black text-foreground">Similar Numbers</h2><p className="mt-1 text-sm text-muted-foreground">Ranked by pattern, category, numerology, and price closeness.</p></div>
            <Link to={`/number/${data.number_id}/similar`} className="btn-gold-outline">View all similar numbers</Link>
          </div>
          <div className="number-card-grid">{related.map((n) => <NumberCard key={n.number_id} item={n} />)}</div>
        </div>
      )}

      <div className="mt-6">
        <h2 className="mb-4 text-base font-black text-foreground">Reviews</h2>
        <div className="vnw-card mb-5 p-5">
          <div className="mb-2 flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <button key={i} onClick={() => setRating(i + 1)}>
                <Star className={cn('h-5 w-5', i < rating ? 'text-primary' : 'text-muted-foreground')} fill={i < rating ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Share your experience..." className="input-luxury w-full" />
          <button onClick={submitReview} className="btn-gold mt-3 text-sm">Submit Review</button>
        </div>

        {data.reviews?.length ? (
          <div className="space-y-3">
            {data.reviews.map((r: any) => (
              <div key={r.review_id} className="vnw-card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-black text-foreground">{r.full_name || 'Customer'}</span>
                  <span className="flex gap-0.5 text-primary">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5" fill="currentColor" />)}</span>
                </div>
                {r.comment && <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>}
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground">No reviews yet. Be the first!</p>}
      </div>
    </div>
  );
}
