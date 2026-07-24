import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { numbersAPI, categoriesAPI, testimonialsAPI, siteAPI, carouselAPI, type HeroStats } from '@/core/api/vnwAPI';
import type { PublishedCarouselSlide } from '@/core/carousel/types';
import type { NumberCategory } from '@/core/categories/types';
import NumberCard, { NumberItem } from '@/shared/components/NumberCard';
import { getRecentlyViewed } from '@/core/lib/recentlyViewed';
import { useStore } from '@/shared/store/useStore';
import {
  CategorySection,
  BudgetBandsSection,
  FinalEnquiryCta,
  HomeHero,
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
import SearchWorkbench from '@/pages/shop/SearchWorkbench';

export default function Home() {
  const { site } = useStore();
  const [numbers, setNumbers] = useState<NumberItem[]>([]);
  const [categories, setCategories] = useState<NumberCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [testimonials, setTestimonials] = useState<HomeTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState('');
  const [heroStats, setHeroStats] = useState<HeroStats | null>(null);
  const [heroStatsLoading, setHeroStatsLoading] = useState(true);
  const [heroStatsError, setHeroStatsError] = useState(false);
  const [carouselSlides, setCarouselSlides] = useState<PublishedCarouselSlide[]>([]);
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
    categoriesAPI.list()
      .then((data) => setCategories(data || []))
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoading(false));
    testimonialsAPI.list()
      .then((data) => setTestimonials(data || []))
      .catch(() => setTestimonials([]));
    numbersAPI.list({ sort: 'popular', limit: 4 })
      .then((data) => setTrending(data.items || []))
      .catch(() => setTrending([]));
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
    <div className="bg-background text-foreground">
      <HomeHero stats={heroStats} statsLoading={heroStatsLoading} statsError={heroStatsError} />

      <SearchWorkbench placement="home" />

      <HomeCarousel slides={carouselSlides} loading={carouselLoading} />

      <CategorySection categories={categories} loading={categoriesLoading} />

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
          <Link to="/shop" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold text-foreground shadow-sm transition hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            View all numbers
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        }
      />

      <WhyChooseSection />

      <HowItWorksSection />

      <ServiceCoverageSection />

      {trending.length > 0 && (
        <section className="bg-card px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              title="Trending now"
              description="Numbers returned by the existing popular-number feed."
              action={
                <Link to="/shop?sort=popular" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold text-foreground shadow-sm transition hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
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
        <section className="bg-background px-4 py-8 sm:px-6 lg:px-8">
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
