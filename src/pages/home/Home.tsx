import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { numbersAPI, siteAPI, carouselAPI, type DealOfDayItem } from '@/core/api/vnwAPI';
import type { PublishedCarouselSlide } from '@/core/carousel/types';
import NumberCard, { NumberItem } from '@/shared/components/NumberCard';
import { getRecentlyViewed } from '@/core/lib/recentlyViewed';
import {
  HomeHero,
  HowItWorksSection,
  NumberGridSection,
  SectionHeader,
} from './components/HomeSections';
import HomeCarousel from './components/HomeCarousel';
import SearchWorkbench from '@/pages/shop/SearchWorkbench';

export default function Home() {
  const [numbers, setNumbers] = useState<NumberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState('');
  const [dealsOfDay, setDealsOfDay] = useState<DealOfDayItem[]>([]);
  const [dealsLoading, setDealsLoading] = useState(true);
  const [dealsError, setDealsError] = useState(false);
  const [carouselSlides, setCarouselSlides] = useState<PublishedCarouselSlide[]>([]);
  const [carouselLoading, setCarouselLoading] = useState(true);
  const [recent] = useState<NumberItem[]>(() => getRecentlyViewed() as NumberItem[]);

  useEffect(() => {
    setDealsLoading(true);
    setDealsError(false);
    siteAPI.dealsOfDay()
      .then((data) => setDealsOfDay(data.items || []))
      .catch(async () => {
        try {
          const fallback = await numbersAPI.featured({ limit: 8, sort: 'popular' });
          setDealsOfDay((fallback.items || []).map((item: any, index: number) => ({
            ...item,
            deal_id: null,
            hero_label: null,
            hero_description: null,
            sort_order: index,
            is_active: true,
            source: 'FEATURED_FALLBACK' as const,
          })));
        } catch {
          setDealsOfDay([]);
          setDealsError(true);
        }
      })
      .finally(() => setDealsLoading(false));
  }, []);

  useEffect(() => {
    carouselAPI.list()
      .then((data) => setCarouselSlides(data || []))
      .catch(() => setCarouselSlides([]))
      .finally(() => setCarouselLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    setFeaturedError('');
    numbersAPI.list({ is_featured: 1, limit: 10, sort: 'newest' })
      .then((data) => setNumbers(data.items || []))
      .catch((error: any) => {
        setNumbers([]);
        setFeaturedError(error?.message || 'Please try again later.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-background text-foreground">
      <HomeHero deals={dealsOfDay} dealsLoading={dealsLoading} dealsError={dealsError} />

      <SearchWorkbench placement="home" />

      <HomeCarousel slides={carouselSlides} loading={carouselLoading} />

      <NumberGridSection
        title="Featured VIP numbers"
        description="Curated listings from the existing featured-number feed."
        numbers={numbers}
        loading={loading}
        error={featuredError}
        emptyTitle="No featured numbers are available right now."
        action={
          <Link to="/shop" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold text-foreground shadow-sm transition hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            View all numbers
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        }
      />

      <HowItWorksSection />

      {recent.length > 0 && (
        <section className="bg-background px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeader title="Recently viewed" description="Continue from numbers you viewed earlier on this device." />
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {recent.slice(0, 5).map((number) => <NumberCard key={number.number_id} item={number} />)}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
