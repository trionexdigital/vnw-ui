import { create } from 'zustand';
import { cartAPI, wishlistAPI, siteAPI } from '@/core/api/vnwAPI';
import { localService } from '@/core/services/local';
import { APP_CONFIG } from '@/core/config/app.config';

const COMPARE_KEY = 'vnw_compare';

export interface SiteSettings {
  SITE_TITLE?: string; SITE_TAGLINE?: string; CONTACT_EMAIL?: string; CONTACT_PHONE?: string;
  WHATSAPP?: string; PROMO_TEXT?: string; PROMO_COUPON?: string; SUPPORT_ADDRESS?: string;
}

interface StoreState {
  cartCount: number;
  wishlistCount: number;
  compare: number[];
  site: SiteSettings;
  siteLoaded: boolean;
  refreshCounts: () => Promise<void>;
  loadSite: () => Promise<void>;
  setCartCount: (n: number) => void;
  setWishlistCount: (n: number) => void;
  toggleCompare: (id: number) => void;
  clearCompare: () => void;
}

const loadCompare = (): number[] => {
  try { return JSON.parse(localStorage.getItem(COMPARE_KEY) || '[]'); } catch { return []; }
};

export const useStore = create<StoreState>((set, get) => ({
  cartCount: 0,
  wishlistCount: 0,
  compare: loadCompare(),
  site: { WHATSAPP: APP_CONFIG.whatsapp, CONTACT_PHONE: APP_CONFIG.contactPhone, CONTACT_EMAIL: APP_CONFIG.contactEmail },
  siteLoaded: false,

  loadSite: async () => {
    try {
      const s = await siteAPI.settings();
      if (s && Object.keys(s).length) set({ site: { ...get().site, ...s }, siteLoaded: true });
      else set({ siteLoaded: true });
    } catch { set({ siteLoaded: true }); }
  },

  refreshCounts: async () => {
    if (!localService.getToken()) { set({ cartCount: 0, wishlistCount: 0 }); return; }
    try {
      const [cart, wish] = await Promise.all([cartAPI.list(), wishlistAPI.list()]);
      set({ cartCount: cart?.count ?? 0, wishlistCount: wish?.count ?? 0 });
    } catch { /* ignore */ }
  },
  setCartCount: (n) => set({ cartCount: n }),
  setWishlistCount: (n) => set({ wishlistCount: n }),
  toggleCompare: (id) => {
    const cur = get().compare;
    let next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(-4);
    localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
    set({ compare: next });
  },
  clearCompare: () => { localStorage.setItem(COMPARE_KEY, '[]'); set({ compare: [] }); },
}));
