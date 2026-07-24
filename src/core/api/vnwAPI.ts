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
import type { CategoryClassification, NumberCategory } from '@/core/categories/types';

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
  seller_id?: number;
  sort?: string;
  page?: number;
  limit?: number;
  search?: NumberSearchRequest;
  include_alternatives?: boolean;
  [key: string]: unknown;
}

export const numbersAPI = {
  list: (p: NumberListRequest) => post('numbers/list', p),
  aiSearch: (p: NumberListRequest & { query: string }) => post('numbers/ai-search', p),
  featured: (p: NumberListRequest = {}) => post('numbers/featured', p),
  detail: (number_id: number) => post('numbers/detail', { number_id }),
};

export const categoriesAPI = {
  list: () => post<NumberCategory[]>('categories/list', {}),
  classify: (number: string) => post<CategoryClassification>('categories/classify', { number }),
};

export const cartAPI = {
  list: () => post('cart/list', {}),
  add: (number_id: number) => post('cart/add', { number_id }),
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

export const siteAPI = {
  settings: () => post('site/settings', {}),
  heroStats: () => post<HeroStats>('site/hero-stats', {}),
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
  ordersList: (p: any = {}) => post('admin/orders/list', p),
  orderDetail: (order_id: number) => post('admin/orders/detail', { order_id }),
  orderUpdateStatus: (order_id: number, status: string) => post('admin/orders/update-status', { order_id, status }),
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
};
