import { useEffect, useState } from 'react';
import {
  numbersAPI, siteAPI, carouselAPI,
  type DealOfDayItem, type FaqItem, type TrustedClient,
} from '@/core/api/vnwAPI';
import type { PublishedCarouselSlide } from '@/core/carousel/types';
import { HomeHero } from './components/HomeSections';
import {
  FaqPreview, JourneyPreview, MarketplaceCta, TrustedClientsSection,
} from './components/MarketplaceSections';
import {
  HomeCategoryShortcuts, HomeFamilyShelf, HomeNumberShelf, HomePatternGallery, HomeReadinessPaths, HomeTrustStrip,
  budgetChoices, homeShelves,
} from './components/HomeDiscovery';
import HomeCarousel from './components/HomeCarousel';
import ReviewScreenshots from './components/ReviewScreenshots';
import CorporateNumbers from '@/pages/corporate/CorporateNumbers';
import HomeDeliveryCities from './components/HomeDeliveryCities';
import SearchWorkbench from '@/pages/shop/SearchWorkbench';

export default function Home() {
  const [dealsOfDay, setDealsOfDay] = useState<DealOfDayItem[]>([]);
  const [dealsLoading, setDealsLoading] = useState(true);
  const [dealsError, setDealsError] = useState(false);
  const [carouselSlides, setCarouselSlides] = useState<PublishedCarouselSlide[]>([]);
  const [carouselLoading, setCarouselLoading] = useState(true);
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
    Promise.allSettled([siteAPI.trustedClients(), siteAPI.faqs()]).then((results) => {
      if (results[0].status === 'fulfilled') setClients(results[0].value);
      if (results[1].status === 'fulfilled') setFaqs(results[1].value);
    });
  }, []);

  return (
    <div className="bg-background text-foreground">
      <HomeHero deals={dealsOfDay} dealsLoading={dealsLoading} dealsError={dealsError} />
      <SearchWorkbench placement="home" />
      <HomeTrustStrip />
      <HomeCategoryShortcuts />
      <HomeReadinessPaths />
      <HomeCarousel slides={carouselSlides} loading={carouselLoading} />
      <HomeNumberShelf id="home-premium" eyebrow="Handpicked for you" title="Premium numbers" description="Distinctive numbers with presence, personality and a pattern you will remember." query={{ is_premium: 1, sort: 'popular' }} href="/premium-numbers" tone="cream" />
      {homeShelves.slice(0, 2).map((shelf) => <HomeNumberShelf key={shelf.id} {...shelf} />)}
      <HomeFamilyShelf />
      <CorporateNumbers preview />
      <HomeDeliveryCities />
      <HomeNumberShelf {...homeShelves[5]} />
      {homeShelves.slice(2, 4).map((shelf) => <HomeNumberShelf key={shelf.id} {...shelf} />)}
      <HomeNumberShelf {...homeShelves[6]} />
      <HomeNumberShelf id="home-budget" eyebrow="Find your sweet spot" title="A number for every budget" description="Choose a price range and see available numbers without digging through filters." choices={budgetChoices} tone="light" />
      <HomeNumberShelf {...homeShelves[4]} />
      <HomeNumberShelf id="home-new" eyebrow="Just added" title="Fresh from the collection" description="Newly listed public numbers, ready for you to explore." query={{ sort: 'newest' }} href="/newly-added-vip-numbers" tone="cream" />
      <HomePatternGallery />
      <JourneyPreview />
      <TrustedClientsSection clients={clients} />
      <ReviewScreenshots />
      <FaqPreview faqs={faqs} />
      <MarketplaceCta />
    </div>
  );
}
