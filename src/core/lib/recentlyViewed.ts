const KEY = 'vnw_recent';
const MAX = 8;

export interface RecentItem {
  number_id: number;
  display_number: string;
  title_label?: string;
  badge?: string;
  mrp: number;
  offer_price: number;
  discount_pct?: number;
  numerology_sum?: number;
  operator?: string;
  category_name?: string;
  stock?: number;
  status?: string;
}

export const getRecentlyViewed = (): RecentItem[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
};

export const pushRecentlyViewed = (item: RecentItem) => {
  try {
    const cur = getRecentlyViewed().filter((x) => x.number_id !== item.number_id);
    const next = [item, ...cur].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch { /* ignore */ }
};
