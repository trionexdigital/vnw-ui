import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, ShieldCheck, ArrowLeft, MessageCircle, Share2, PhoneCall } from 'lucide-react';
import { numbersAPI, cartAPI, wishlistAPI, reviewsAPI, siteAPI } from '@/core/api/vnwAPI';
import { useStore } from '@/shared/store/useStore';
import { localService } from '@/core/services/local';
import { useToast } from '@/shared/hooks/use-toast';
import { formatINR } from '@/core/lib/format';
import { Loader } from '@/shared/components/ui-bits';
import { pushRecentlyViewed } from '@/core/lib/recentlyViewed';
import NumberCard from '@/shared/components/NumberCard';
import { cn } from '@/core/lib/utils';
import { PremiumNumberShowcaseCard } from '@/shared/components/PremiumShowcaseCards';

export default function NumberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshCounts, site } = useStore();
  const [data, setData] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [enq, setEnq] = useState({ name: '', phone: '' });
  const [enqBusy, setEnqBusy] = useState(false);

  const load = () => {
    setLoading(true);
    numbersAPI.detail(Number(id)).then((d) => {
      setData(d);
      pushRecentlyViewed(d);
      if (d?.category_slug || d?.category_id) {
        numbersAPI.list({ category: d.category_slug || d.category_id, limit: 5, status: 'AVAILABLE' })
          .then((r) => setRelated((r.items || []).filter((x: any) => x.number_id !== d.number_id).slice(0, 4))).catch(() => {});
      }
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
  if (!data) return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">Number not found. <Link to="/shop" className="text-[#7c2cff]">Back to shop</Link></div>;

  const sold = data.status !== 'AVAILABLE';
  const wa = (site.WHATSAPP || '').replace(/\D/g, '');
  const waLink = `https://wa.me/${wa}?text=${encodeURIComponent(`Hi! I'm interested in VIP number ${data.display_number} (${formatINR(data.offer_price)}). Is it available?`)}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-[#7c2cff]"><ArrowLeft className="h-4 w-4" /> Back</button>
        <button onClick={share} className="flex items-center gap-2 rounded-2xl bg-white/58 px-4 py-2 text-sm font-bold text-muted-foreground shadow-sm hover:text-[#7c2cff]"><Share2 className="h-4 w-4" /> Share</button>
      </div>

      <PremiumNumberShowcaseCard
        number={data.display_number}
        title={data.title_label || 'Signature VIP Number'}
        pattern={data.category_name || 'Hexa Pattern'}
        mrp={data.mrp}
        offerPrice={data.offer_price}
        discount={data.discount_pct || Math.round(((Number(data.mrp) - Number(data.offer_price)) / Number(data.mrp)) * 100)}
        sum={data.numerology_sum}
        onBuy={() => requireAuth() && navigate(`/checkout?number_id=${data.number_id}`)}
        onCart={addToCart}
        onWish={addWish}
        sold={sold}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="vnw-card p-6">
          <h2 className="text-xl font-black text-[#1d1830]">Number Details</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{data.description || 'A premium VIP number, ready for instant booking and secure ownership transfer.'}</p>
          <div className="mt-5 flex flex-wrap gap-3 text-xs font-bold text-muted-foreground">
            <span className="rounded-2xl bg-white/58 px-4 py-2"><ShieldCheck className="mr-1 inline h-4 w-4 text-[#7c2cff]" /> 100% genuine</span>
            <span className="rounded-2xl bg-white/58 px-4 py-2">Secure Razorpay payment</span>
            <span className="rounded-2xl bg-white/58 px-4 py-2">Quick transfer support</span>
          </div>
          {wa && <a className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3 font-black text-white transition-all hover:brightness-105" href={waLink} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp Enquiry</a>}
        </div>

        <form onSubmit={submitEnquiry} className="vnw-card h-fit p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-black text-[#1d1830]"><PhoneCall className="h-4 w-4 text-[#7c2cff]" /> Request a Callback</div>
          <div className="space-y-3">
            <input required placeholder="Your name" value={enq.name} onChange={(e) => setEnq({ ...enq, name: e.target.value })} className="input-luxury w-full" />
            <input required placeholder="Phone" value={enq.phone} onChange={(e) => setEnq({ ...enq, phone: e.target.value })} className="input-luxury w-full" />
            <button disabled={enqBusy} className="btn-royal w-full">{enqBusy ? 'Sending...' : 'Call Me'}</button>
          </div>
        </form>
      </div>

      {related.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-xl font-black text-[#1d1830]">Similar Numbers</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{related.map((n) => <NumberCard key={n.number_id} item={n} />)}</div>
        </div>
      )}

      <div className="mt-10">
        <h2 className="mb-4 text-xl font-black text-[#1d1830]">Reviews</h2>
        <div className="vnw-card mb-5 p-5">
          <div className="mb-2 flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <button key={i} onClick={() => setRating(i + 1)}>
                <Star className={cn('h-5 w-5', i < rating ? 'text-[#d9a31b]' : 'text-muted-foreground')} fill={i < rating ? 'currentColor' : 'none'} />
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
                  <span className="font-black text-[#1d1830]">{r.full_name || 'Customer'}</span>
                  <span className="flex gap-0.5 text-[#d9a31b]">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5" fill="currentColor" />)}</span>
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
