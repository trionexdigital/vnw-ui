import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import {
  categoriesAPI, numbersAPI, siteAPI, carouselAPI,
  type DealOfDayItem, type FaqItem, type OperatorFacet, type TrustedClient,
} from '@/core/api/vnwAPI';
import type { PublishedCarouselSlide } from '@/core/carousel/types';
import type { NumberCategory } from '@/core/categories/types';
import type { NumberItem } from '@/shared/components/NumberCard';
import { HomeHero, NumberGridSection, CategorySection } from './components/HomeSections';
import {
  CorporatePackPreview, FaqPreview, JourneyPreview, MarketplaceCta, OperatorSection, TrustedClientsSection,
} from './components/MarketplaceSections';
import HomeCarousel from './components/HomeCarousel';
import SearchWorkbench from '@/pages/shop/SearchWorkbench';

export default function Home() {
  const [newest, setNewest] = useState<NumberItem[]>([]);
  const [premium, setPremium] = useState<NumberItem[]>([]);
  const [numbersLoading, setNumbersLoading] = useState(true);
  const [numbersError, setNumbersError] = useState('');
  const [dealsOfDay, setDealsOfDay] = useState<DealOfDayItem[]>([]);
  const [dealsLoading, setDealsLoading] = useState(true);
  const [dealsError, setDealsError] = useState(false);
  const [carouselSlides, setCarouselSlides] = useState<PublishedCarouselSlide[]>([]);
  const [carouselLoading, setCarouselLoading] = useState(true);
  const [categories, setCategories] = useState<NumberCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [operators, setOperators] = useState<OperatorFacet[]>([]);
  const [clients, setClients] = useState<TrustedClient[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);

  useEffect(() => {
    setDealsLoading(true);
    setDealsError(false);
    siteAPI.dealsOfDay()
      .then((data) => setDealsOfDay(data.items || []))
      .catch(async () => {
        try {
          const fallback = await numbersAPI.featured({ limit: 8, sort: 'popular' });
          setDealsOfDay((fallback.items || []).map((item: any, index: number) => ({
            ...item, deal_id: null, hero_label: null, hero_description: null, sort_order: index,
            is_active: true, source: 'FEATURED_FALLBACK' as const,
          })));
        } catch { setDealsOfDay([]); setDealsError(true); }
      })
      .finally(() => setDealsLoading(false));
  }, []);

  useEffect(() => {
    carouselAPI.list().then((data) => setCarouselSlides(data || [])).catch(() => setCarouselSlides([])).finally(() => setCarouselLoading(false));
  }, []);

  useEffect(() => {
    setNumbersLoading(true); setNumbersError('');
    Promise.all([
      numbersAPI.list({ limit: 10, sort: 'newest' }),
      numbersAPI.list({ is_premium: 1, limit: 10, sort: 'popular' }),
    ]).then(([newestData, premiumData]) => {
      setNewest(newestData.items || []); setPremium(premiumData.items || []);
    }).catch((error: any) => {
      setNewest([]); setPremium([]); setNumbersError(error?.message || 'Please try again later.');
    }).finally(() => setNumbersLoading(false));
  }, []);

  useEffect(() => {
    categoriesAPI.list().then(setCategories).catch(() => setCategories([])).finally(() => setCategoriesLoading(false));
    Promise.allSettled([siteAPI.operators(), siteAPI.trustedClients(), siteAPI.faqs()]).then((results) => {
      if (results[0].status === 'fulfilled') setOperators(results[0].value);
      if (results[1].status === 'fulfilled') setClients(results[1].value);
      if (results[2].status === 'fulfilled') setFaqs(results[2].value);
    });
  }, []);

  const viewAll = (to: string, label: string) => <Link to={to} className="btn-gold-outline">{label}<ArrowRight className="h-4 w-4" /></Link>;

  return (
    <div className="bg-background text-foreground">
      <HomeHero deals={dealsOfDay} dealsLoading={dealsLoading} dealsError={dealsError} />
      <SearchWorkbench placement="home" />
      <HomeCarousel slides={carouselSlides} loading={carouselLoading} />

      <NumberGridSection title="Newly added VIP numbers" description="Fresh premium identities added to the marketplace." numbers={newest.slice(0, 10)} loading={numbersLoading} error={numbersError} emptyTitle="No newly added numbers are available right now." action={viewAll('/newly-added-vip-numbers', 'View all new numbers')} />
      <NumberGridSection title="Premium numbers" description="Curated memorable listings selected for distinction and impact." numbers={premium.slice(0, 10)} loading={numbersLoading} error={numbersError} emptyTitle="No premium numbers are available right now." action={viewAll('/premium-numbers', 'View premium collection')} />
      <CorporatePackPreview />
      <CategorySection categories={categories} loading={categoriesLoading} />
      <OperatorSection operators={operators} />
      <JourneyPreview />
      <TrustedClientsSection clients={clients} />
      <FaqPreview faqs={faqs} />
      <MarketplaceCta />
    </div>
  );
}
