import { httpService } from '../services/http';
import { BASE_URL } from './baseURL';

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

export const numbersAPI = {
  list: (p: any) => post('numbers/list', p),
  aiSearch: (p: any) => post('numbers/ai-search', p),
  featured: (p: any = {}) => post('numbers/featured', p),
  detail: (number_id: number) => post('numbers/detail', { number_id }),
};

export const categoriesAPI = {
  list: () => post('categories/list', {}),
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
  is_active: boolean | number;
  sort_order: number;
}

export const carouselAPI = {
  list: () => post<CarouselSlide[]>('banners/list', {}),
};

// Backward-compatible export for existing banner consumers.
export const bannersAPI = carouselAPI;

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
  categoriesList: () => post('employee/categories/list', {}),
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
  categoriesList: () => post('admin/categories/list', {}),
  categorySave: (p: any) => post('admin/categories/save', p),
  categoryDelete: (category_id: number) => post('admin/categories/delete', { category_id }),
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
