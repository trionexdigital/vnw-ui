import { httpService } from '../services/http';
import { BASE_URL } from './baseURL';
import type {
  CarouselAsset,
  CarouselDocument,
  CarouselProject,
  CarouselProjectSummary,
  CarouselTransition,
  PublishedCarouselSlide,
} from '@/core/carousel/types';
import type { CategorizedNumber, CategoryClassification, NumberCategory } from '@/core/categories/types';

/** POST helper that unwraps the MasterModel envelope. Throws on status !== 1. */
async function post<T = any>(path: string, payload: any = {}): Promise<T> {
  const res = await httpService.postRequest(BASE_URL + path, payload);
  if (res && res.status === 1) return res.data as T;
  throw new Error(res?.info || 'Request failed');
}

/** POST that returns the raw envelope (for endpoints that signal via status). */
async function postRaw(path: string, payload: any = {}): Promise<any> {
  return httpService.postRequest(BASE_URL + path, payload);
}

export interface NumberSearchRequest {
  starts_with?: string;
  starts_with_pattern?: string;
  anywhere?: string;
  ends_with?: string;
  ends_with_pattern?: string;
  must_contain?: string[];
  must_not_contain?: string[];
  digit_sum?: number;
  mid_sum?: number;
  score_sum?: number;
  exact_mask?: string;
  digit_frequencies?: Array<{ digit: number; min?: number; max?: number }>;
  include_alternatives?: boolean;
}

export interface NumberListRequest {
  category?: string;
  q?: string;
  price_min?: string | number;
  price_max?: string | number;
  numerology?: string | number;
  operator?: string;
  badge?: string;
  is_featured?: boolean | number;
  is_premium?: boolean | number;
  seller_id?: number;
  rtp_status?: 'RTP' | 'NON_RTP';
  rtp_from?: string;
  rtp_to?: string;
  sort?: string;
  page?: number;
  limit?: number;
  search?: NumberSearchRequest;
  include_alternatives?: boolean;
  [key: string]: unknown;
}

export interface NumberCatalogItem extends CategorizedNumber {
  number_id: number;
  number_value?: string;
  display_number: string;
  title_label?: string;
  badge?: string;
  mrp: number;
  offer_price: number;
  discount_pct?: number;
  numerology_sum?: number;
  operator?: string;
  stock?: number;
  status?: string;
  rtp_status?: 'RTP' | 'NON_RTP';
  rtp_available_at?: string | null;
  is_premium?: boolean;
}

export interface SimilarNumbersRequest {
  number_id: number;
  page?: number;
  limit?: number;
}

export interface SimilarNumbersResponse {
  source: NumberCatalogItem;
  items: NumberCatalogItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const numbersAPI = {
  list: (p: NumberListRequest) => post('numbers/list', p),
  aiSearch: (p: NumberListRequest & { query: string }) => post('numbers/ai-search', p),
  featured: (p: NumberListRequest = {}) => post('numbers/featured', p),
  detail: (number_id: number) => post('numbers/detail', { number_id }),
  similar: (p: SimilarNumbersRequest) => post<SimilarNumbersResponse>('numbers/similar', p),
  operators: () => post<OperatorFacet[]>('numbers/operators', {}),
};

export const categoriesAPI = {
  list: () => post<NumberCategory[]>('categories/list', {}),
  classify: (number: string) => post<CategoryClassification>('categories/classify', { number }),
};

export const cartAPI = {
  list: () => post('cart/list', {}),
  add: (number_id: number) => post('cart/add', { number_id }),
  addMany: (number_ids: number[]) => post('cart/add-many', { number_ids }),
  remove: (number_id: number) => post('cart/remove', { number_id }),
  clear: () => post('cart/clear', {}),
};

export const wishlistAPI = {
  list: () => post('wishlist/list', {}),
  add: (number_id: number) => post('wishlist/add', { number_id }),
  remove: (number_id: number) => post('wishlist/remove', { number_id }),
};

export const ordersAPI = {
  create: (p: any) => post('orders/create', p),
  my: () => post('orders/my', {}),
  detail: (order_id: number) => post('orders/detail', { order_id }),
};

export const paymentsAPI = {
  createRazorpayOrder: (order_id: number) => post('payments/razorpay/create-order', { order_id }),
  verify: (p: any) => post('payments/razorpay/verify', p),
};

export const reviewsAPI = {
  byNumber: (number_id: number) => post('reviews/by-number', { number_id }),
  create: (p: any) => post('reviews/create', p),
};

export const testimonialsAPI = {
  list: () => post('testimonials/list', {}),
};

export interface CarouselSlide {
  banner_id: number;
  eyebrow?: string | null;
  title?: string | null;
  subtitle?: string | null;
  image: string;
  cta_text?: string | null;
  cta_link?: string | null;
  content_x?: number | null;
  content_y?: number | null;
  content_width?: number | null;
  content_rotation?: number | null;
  content_style?: 'light' | 'dark' | 'brand' | 'minimal' | null;
  text_align?: 'left' | 'center' | 'right' | null;
  font_style?: 'serif' | 'sans' | 'display' | null;
  title_size?: 'small' | 'medium' | 'large' | null;
  overlay_style?: 'soft' | 'dark' | 'light' | 'brand' | 'none' | null;
  is_active: boolean | number;
  sort_order: number;
}

export const bannersAPI = {
  list: () => post<CarouselSlide[]>('banners/list', {}),
};

export type RtpStatus = 'RTP' | 'NON_RTP';
export type PrebookStatus = 'PENDING_PAYMENT' | 'BOOKED' | 'READY' | 'CANCEL_REQUESTED' | 'REFUND_PENDING' | 'REFUNDED' | 'FULFILLED' | 'FAILED';

export interface PrebookRecord {
  prebook_id: number;
  order_id: number;
  order_no: string;
  number_id: number;
  display_number: string;
  operator?: string | null;
  total: number;
  status: PrebookStatus;
  payment_status: string;
  rtp_status: RtpStatus;
  rtp_available_at: string;
  cancellation_deadline?: string | null;
  cancellation_seconds_remaining: number;
  can_cancel: boolean;
  refund_status?: string | null;
  reason_type?: string | null;
}

export const prebooksAPI = {
  catalog: (p: NumberListRequest = {}) => post<{ items: any[]; total: number; page: number; limit: number }>('prebooks/catalog', p),
  create: (number_id: number) => post<{ prebook_id: number; order_id: number; order_no: string; total: number; payment_expires_at: string }>('prebooks/create', { number_id }),
  my: () => post<PrebookRecord[]>('prebooks/my', {}),
  cancel: (prebook_id: number, note?: string) => post('prebooks/cancel', { prebook_id, note }),
  reportIssue: (prebook_id: number, reason_type: string, note: string) => post('prebooks/report-issue', { prebook_id, reason_type, note }),
};

export const carouselAPI = {
  list: () => post<PublishedCarouselSlide[]>('carousel/list', {}),
  assetBlob: (assetId: number) => httpService.downloadRequest(BASE_URL + `carousel/asset/${assetId}`),
  previewBlob: (assetId: number) => httpService.downloadRequest(BASE_URL + `carousel/preview/${assetId}`),
};

export const adminCarouselAPI = {
  list: () => post<CarouselProjectSummary[]>('admin/carousel/list', {}),
  create: (name: string, desktop?: CarouselDocument, mobile?: CarouselDocument) =>
    post<{ carousel_id: number; revision: number }>('admin/carousel/create', { name, desktop, mobile }),
  get: (carousel_id: number) => post<CarouselProject>('admin/carousel/get', { carousel_id }),
  saveDraftRaw: (payload: {
    carousel_id: number;
    revision: number;
    name: string;
    desktop: CarouselDocument;
    mobile: CarouselDocument;
    desktop_preview_id?: number | null;
    mobile_preview_id?: number | null;
    transition_style: CarouselTransition;
    autoplay_seconds: number;
  }) => postRaw('admin/carousel/draft/save', payload),
  publishRaw: (carousel_id: number, revision: number) => postRaw('admin/carousel/publish', { carousel_id, revision }),
  unpublish: (carousel_id: number) => post('admin/carousel/unpublish', { carousel_id }),
  duplicate: (carousel_id: number) => post<{ carousel_id: number }>('admin/carousel/duplicate', { carousel_id }),
  reorder: (carousel_ids: number[]) => post('admin/carousel/reorder', { carousel_ids }),
  delete: (carousel_id: number) => post('admin/carousel/delete', { carousel_id }),
  deleteAsset: (carousel_id: number, asset_id: number) => post('admin/carousel/asset/delete', { carousel_id, asset_id }),
  uploadAsset: async (carouselId: number, file: File | Blob, purpose: CarouselAsset['purpose'], width: number, height: number, fileName?: string) => {
    const form = new FormData();
    form.append('carousel_id', String(carouselId));
    form.append('purpose', purpose);
    form.append('width', String(width));
    form.append('height', String(height));
    form.append('file', file, fileName || (file instanceof File ? file.name : `${purpose}.png`));
    const response = await httpService.uploadRequest(BASE_URL + 'admin/carousel/asset/upload', form);
    if (response?.status === 1) return response.data as CarouselAsset;
    throw new Error(response?.info || 'Upload failed');
  },
  assetBlob: (assetId: number) => httpService.downloadRequest(BASE_URL + `admin/carousel/asset/${assetId}`),
};

export const referralAPI = {
  validate: (code: string) => postRaw('referral/validate', { code }),
  mySummary: () => post('referral/my-summary', {}),
};

export const dashboardAPI = {
  summary: () => post('dashboard/summary', {}),
};

export const contactAPI = {
  submit: (p: any) => postRaw('contact/submit', p),
};

export interface HeroStats {
  delivered_numbers: number;
  available_numbers: number;
  customers_served: number;
}

export type DealOfDaySource = 'CURATED' | 'FEATURED_FALLBACK';

export interface DealOfDayItem extends CategorizedNumber {
  deal_id: number | null;
  number_id: number;
  number_value?: string;
  display_number: string;
  title_label?: string | null;
  badge?: string | null;
  mrp: number;
  offer_price: number;
  discount_pct?: number;
  numerology_sum?: number | null;
  operator?: string | null;
  description?: string | null;
  stock?: number;
  status?: string;
  rtp_status?: RtpStatus;
  rtp_available_at?: string | null;
  is_featured?: boolean | number;
  is_premium?: boolean;
  hero_label?: string | null;
  hero_description?: string | null;
  sort_order: number;
  is_active: boolean;
  source: DealOfDaySource;
}

export interface DealOfDayResponse {
  items: DealOfDayItem[];
  source: DealOfDaySource;
}

export interface DealOfDaySaveInput {
  deal_id?: number | null;
  number_id: number;
  hero_label?: string | null;
  hero_description?: string | null;
  is_active: boolean;
}

export type CorporatePackType = 'SERIES' | 'MIXED' | 'SIMILAR_START' | 'SIMILAR_END' | 'SIMILAR_BOTH';

export interface CorporatePackQuery {
  pack_type: CorporatePackType;
  size: number;
  limit?: number;
}

export interface CorporatePack {
  pack_id: string;
  title: string;
  pack_type: CorporatePackType;
  description?: string | null;
  sort_order: number;
  is_active: boolean;
  size: number;
  total_price: number;
  is_available: boolean;
  numbers: Array<CategorizedNumber & {
    number_id: number;
    display_number: string;
    offer_price: number;
    status: string;
    stock: number;
    operator?: string | null;
  }>;
}

export interface OperatorFacet { operator: string; count: number; }

export interface TrustedClient {
  client_id: number;
  name: string;
  website_url?: string | null;
  alt_text?: string | null;
  has_logo: boolean;
  logo_url?: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface FaqItem {
  faq_id: number;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
}

export const siteAPI = {
  settings: () => post('site/settings', {}),
  heroStats: () => post<HeroStats>('site/hero-stats', {}),
  dealsOfDay: () => post<DealOfDayResponse>('site/deals-of-day', {}),
  familyPacks: (p: CorporatePackQuery) => post<CorporatePack[]>('site/family-packs', p),
  // Legacy alias retained for integrations that still call the previous API name.
  corporatePacks: (p: CorporatePackQuery) => post<CorporatePack[]>('site/family-packs', p),
  operators: () => post<OperatorFacet[]>('site/operators', {}),
  trustedClients: () => post<TrustedClient[]>('site/trusted-clients', {}),
  trustedClientLogoUrl: (clientId: number) => BASE_URL + `site/trusted-clients/${clientId}/logo`,
  faqs: () => post<FaqItem[]>('site/faqs', {}),
  homePremiumNumbers: () => post<any[]>('site/home-premium-numbers', {}),
  subscribe: (email: string, source = 'footer') => postRaw('site/newsletter', { email, source }),
  enquiry: (p: any) => postRaw('site/enquiry', p),
};

export const notificationsAPI = {
  get: () => post('notifications/get', {}),
  markAllRead: () => post('notifications/mark-all-read', {}),
};

export const dealerAPI = {
  dashboard: () => post('dealer/dashboard', {}),
  listings: () => post('dealer/listings', {}),
  createListing: (p: any) => post('dealer/listing/create', p),
  updateListing: (p: any) => post('dealer/listing/update', p),
  deleteListing: (number_id: number) => post('dealer/listing/delete', { number_id }),
  sales: () => post('dealer/sales', {}),
  profile: () => post('dealer/profile', {}),
  updateProfile: (p: any) => post('dealer/profile/update', p),
  requestPayout: (amount: number) => post('dealer/payout/request', { amount }),
  payouts: () => post('dealer/payouts', {}),
};

export const sellAPI = {
  create: (p: any) => post('sell/create', p),
  mine: () => post('sell/mine', {}),
  cancel: (request_id: number) => post('sell/cancel', { request_id }),
};

export const rbacAPI = {
  myPermissions: () => post<{ permissions: string[] }>('rbac/me', {}),
};

export const walletAPI = {
  summary: () => post('wallet/summary', {}),
  withdraw: (amount: number) => post('wallet/withdraw', { amount }),
};

export const employeeAPI = {
  dashboard: () => post('employee/dashboard', {}),
  numbersList: (p: any = {}) => post('employee/numbers/list', p),
  ordersList: (p: any = {}) => post('employee/orders/list', p),
  usersList: (p: any = {}) => post('employee/users/list', p),
  dealersList: () => post('employee/dealers/list', {}),
  couponsList: () => post('employee/coupons/list', {}),
  sellList: (p: any = {}) => post('employee/sell/list', p),
  actions: () => post('employee/actions', {}),
  submit: (action_key: string, payload: any) => post('employee/submit', { action_key, payload }),
  mySubmissions: () => post('employee/my-submissions', {}),
};

export const adminAPI = {
  dashboard: () => post('admin/dashboard', {}),
  numbersList: (p: any = {}) => post('admin/numbers/list', p),
  numberSave: (p: any) => post('admin/numbers/save', p),
  numberDelete: (number_id: number) => post('admin/numbers/delete', { number_id }),
  numberApprove: (number_id: number) => post('admin/numbers/approve', { number_id }),
  numberReject: (number_id: number) => post('admin/numbers/reject', { number_id }),
  dealsOfDayList: () => post<DealOfDayItem[]>('admin/deals-of-day/list', {}),
  dealOfDaySave: (p: DealOfDaySaveInput) => post<{ deal_id: number }>('admin/deals-of-day/save', p),
  dealsOfDayReorder: (deal_ids: number[]) => post('admin/deals-of-day/reorder', { deal_ids }),
  dealOfDayDelete: (deal_id: number) => post('admin/deals-of-day/delete', { deal_id }),
  ordersList: (p: any = {}) => post('admin/orders/list', p),
  orderDetail: (order_id: number) => post('admin/orders/detail', { order_id }),
  orderUpdateStatus: (order_id: number, status: string) => post('admin/orders/update-status', { order_id, status }),
  prebooksList: (p: any = {}) => post('admin/prebooks/list', p),
  prebookFulfill: (prebook_id: number) => post('admin/prebooks/fulfill', { prebook_id }),
  prebookMarkUnavailable: (prebook_id: number, note: string) => post('admin/prebooks/mark-unavailable', { prebook_id, note }),
  prebookRefundsList: (p: any = {}) => post('admin/prebook-refunds/list', p),
  prebookRefundApprove: (refund_request_id: number, admin_note?: string) => post('admin/prebook-refunds/approve', { refund_request_id, admin_note }),
  prebookRefundReject: (refund_request_id: number, admin_note: string) => post('admin/prebook-refunds/reject', { refund_request_id, admin_note }),
  prebookRefundRetry: (refund_request_id: number, admin_note?: string) => post('admin/prebook-refunds/retry', { refund_request_id, admin_note }),
  usersList: (p: any = {}) => post('admin/users/list', p),
  userSetRole: (target_id: number, role: string) => post('admin/users/set-role', { target_id, role }),
  userSetStatus: (target_id: number, status: string) => post('admin/users/set-status', { target_id, status }),
  dealersList: () => post('admin/dealers/list', {}),
  dealerKyc: (p: any) => post('admin/dealers/kyc', p),
  dealerCreate: (p: any) => post('admin/dealers/create', p),
  employeeCreate: (p: any) => post('admin/employees/create', p),
  permissionCatalog: () => post('admin/permissions/catalog', {}),
  userPermissionsGet: (target_id: number) => post('admin/permissions/user/get', { target_id }),
  userPermissionsSet: (target_id: number, permissions: string[]) => post('admin/permissions/user/set', { target_id, permissions }),
  sellList: (p: any = {}) => post('admin/sell/list', p),
  sellApprove: (p: any) => post('admin/sell/approve', p),
  sellReject: (p: any) => post('admin/sell/reject', p),
  approvalsList: (p: any = {}) => post('admin/approvals/list', p),
  approvalApprove: (approval_id: number) => post('admin/approvals/approve', { approval_id }),
  approvalReject: (approval_id: number, review_note?: string) => post('admin/approvals/reject', { approval_id, review_note }),
  payoutsList: () => post('admin/payouts/list', {}),
  payoutUpdate: (p: any) => post('admin/payouts/update', p),
  reviewsList: (p: any = {}) => post('admin/reviews/list', p),
  reviewModerate: (review_id: number, status: string) => post('admin/reviews/moderate', { review_id, status }),
  testimonialsList: () => post('admin/testimonials/list', {}),
  testimonialSave: (p: any) => post('admin/testimonials/save', p),
  testimonialDelete: (testimonial_id: number) => post('admin/testimonials/delete', { testimonial_id }),
  trustedClientsList: () => post<TrustedClient[]>('admin/trusted-clients/list', {}),
  trustedClientSave: (p: Partial<TrustedClient>) => post<{ client_id: number }>('admin/trusted-clients/save', p),
  trustedClientsReorder: (client_ids: number[]) => post('admin/trusted-clients/reorder', { client_ids }),
  trustedClientDelete: (client_id: number) => post('admin/trusted-clients/delete', { client_id }),
  trustedClientLogoUpload: async (clientId: number, file: File) => {
    const form = new FormData();
    form.append('client_id', String(clientId));
    form.append('file', file, file.name);
    const response = await httpService.uploadRequest(BASE_URL + 'admin/trusted-clients/logo/upload', form);
    if (response?.status === 1) return response.data;
    throw new Error(response?.info || 'Logo upload failed');
  },
  faqsList: () => post<FaqItem[]>('admin/faqs/list', {}),
  faqSave: (p: Partial<FaqItem>) => post<{ faq_id: number }>('admin/faqs/save', p),
  faqsReorder: (faq_ids: number[]) => post('admin/faqs/reorder', { faq_ids }),
  faqDelete: (faq_id: number) => post('admin/faqs/delete', { faq_id }),
  bannersList: () => post<CarouselSlide[]>('admin/banners/list', {}),
  bannerSave: (p: Partial<CarouselSlide>) => post<{ banner_id: number }>('admin/banners/save', p),
  bannerDelete: (banner_id: number) => post('admin/banners/delete', { banner_id }),
  messagesList: () => post('admin/messages/list', {}),
  couponsList: () => post('admin/coupons/list', {}),
  couponSave: (p: any) => post('admin/coupons/save', p),
  couponDelete: (coupon_id: number) => post('admin/coupons/delete', { coupon_id }),
  newsletterList: () => post('admin/newsletter/list', {}),
  settingsGet: () => post('admin/settings/get', {}),
  settingsSave: (p: any) => post('admin/settings/save', p),
  homePremiumList: () => post<any[]>('admin/home-premium/list', {}),
  homePremiumSave: (p: any) => post('admin/home-premium/save', p),
  homePremiumReorder: (homepage_premium_ids: number[]) => post('admin/home-premium/reorder', { homepage_premium_ids }),
  homePremiumRemove: (homepage_premium_id: number) => post('admin/home-premium/remove', { homepage_premium_id }),
};
