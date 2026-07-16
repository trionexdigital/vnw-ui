import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { numbersAPI, categoriesAPI, testimonialsAPI, siteAPI, carouselAPI, type CarouselSlide, type HeroStats } from '@/core/api/vnwAPI';
import NumberCard, { NumberItem } from '@/shared/components/NumberCard';
import { getRecentlyViewed } from '@/core/lib/recentlyViewed';
import { useStore } from '@/shared/store/useStore';
import {
  CategorySection,
  BudgetBandsSection,
  FinalEnquiryCta,
  HomeHero,
  HomeCategory,
  HomeTestimonial,
  HowItWorksSection,
  NumberGridSection,
  PopularPatterns,
  SectionHeader,
  ServiceCoverageSection,
  TestimonialsSection,
  WhyChooseSection,
} from './components/HomeSections';
import HomeCarousel from './components/HomeCarousel';

export default function Home() {
  const { site } = useStore();
  const [numbers, setNumbers] = useState<NumberItem[]>([]);
  const [categories, setCategories] = useState<HomeCategory[]>([]);
  const [testimonials, setTestimonials] = useState<HomeTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState('');
  const [heroStats, setHeroStats] = useState<HeroStats | null>(null);
  const [heroStatsLoading, setHeroStatsLoading] = useState(true);
  const [heroStatsError, setHeroStatsError] = useState(false);
  const [carouselSlides, setCarouselSlides] = useState<CarouselSlide[]>([]);
  const [carouselLoading, setCarouselLoading] = useState(true);
  const [trending, setTrending] = useState<NumberItem[]>([]);
  const [recent] = useState<NumberItem[]>(() => getRecentlyViewed() as NumberItem[]);

  useEffect(() => {
    setHeroStatsLoading(true);
    setHeroStatsError(false);
    siteAPI.heroStats()
      .then((data) => setHeroStats(data))
      .catch(() => {
        setHeroStats(null);
        setHeroStatsError(true);
      })
      .finally(() => setHeroStatsLoading(false));
  }, []);

  useEffect(() => {
    carouselAPI.list()
      .then((data) => setCarouselSlides(data || []))
      .catch(() => setCarouselSlides([]))
      .finally(() => setCarouselLoading(false));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [cats, tlist, trend] = await Promise.all([
          categoriesAPI.list(),
          testimonialsAPI.list(),
          numbersAPI.list({ sort: 'popular', limit: 4 }),
        ]);
        setCategories(cats || []);
        setTestimonials(tlist || []);
        setTrending(trend.items || []);
      } catch {
        setCategories([]);
        setTestimonials([]);
        setTrending([]);
      }
    })();
  }, []);

  useEffect(() => {
    setLoading(true);
    setFeaturedError('');
    numbersAPI.list({ is_featured: 1, limit: 8, sort: 'newest' })
      .then((data) => setNumbers(data.items || []))
      .catch((error: any) => {
        setNumbers([]);
        setFeaturedError(error?.message || 'Please try again later.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-stone-50 text-stone-950">
      <HomeHero stats={heroStats} statsLoading={heroStatsLoading} statsError={heroStatsError} />

      <HomeCarousel slides={carouselSlides} loading={carouselLoading} />

      <PopularPatterns />

      <BudgetBandsSection />

      <NumberGridSection
        title="Featured VIP numbers"
        description="Curated listings from the existing featured-number feed."
        numbers={numbers}
        loading={loading}
        error={featuredError}
        emptyTitle="No featured numbers are available right now."
        action={
          <Link to="/shop" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-900 shadow-sm transition hover:border-amber-700 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2">
            View all numbers
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        }
      />

      <WhyChooseSection />

      <HowItWorksSection />

      <CategorySection categories={categories} />

      <ServiceCoverageSection />

      {trending.length > 0 && (
        <section className="bg-white px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              title="Trending now"
              description="Numbers returned by the existing popular-number feed."
              action={
                <Link to="/shop?sort=popular" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-900 shadow-sm transition hover:border-amber-700 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2">
                  See more
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              }
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trending.map((number) => <NumberCard key={number.number_id} item={number} />)}
            </div>
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section className="bg-stone-50 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeader title="Recently viewed" description="Continue from numbers you viewed earlier on this device." />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recent.slice(0, 4).map((number) => <NumberCard key={number.number_id} item={number} />)}
            </div>
          </div>
        </section>
      )}

      <TestimonialsSection testimonials={testimonials} />

      <FinalEnquiryCta whatsapp={site.WHATSAPP} />
    </div>
  );
}
