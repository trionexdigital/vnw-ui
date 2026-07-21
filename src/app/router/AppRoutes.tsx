import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense, type ReactNode } from 'react';
import { RoleGuard } from './RoleGuard';
import PublicLayout from '@/shared/layout/PublicLayout';
import AccountLayout from '@/shared/layout/AccountLayout';
import { MotionPage } from '@/shared/motion/MotionPrimitives';

// Route-level splitting keeps the storefront fast while preserving every console screen.
const Home = lazy(() => import('@/pages/home/Home'));
const Categories = lazy(() => import('@/pages/categories/Categories'));
const Shop = lazy(() => import('@/pages/shop/Shop'));
const NumberDetail = lazy(() => import('@/pages/shop/NumberDetail'));
const Cart = lazy(() => import('@/pages/cart/Cart'));
const Wishlist = lazy(() => import('@/pages/wishlist/Wishlist'));
const Compare = lazy(() => import('@/pages/compare/Compare'));
const Checkout = lazy(() => import('@/pages/checkout/Checkout'));
const About = lazy(() => import('@/pages/static/About'));
const Contact = lazy(() => import('@/pages/static/Contact'));
const Numerology = lazy(() => import('@/pages/numerology/Numerology'));
const Auth = lazy(() => import('@/pages/auth/Auth'));

const BuyerDashboard = lazy(() => import('@/pages/dashboard/Dashboard'));
const Orders = lazy(() => import('@/pages/orders/Orders'));
const OrderDetail = lazy(() => import('@/pages/orders/OrderDetail'));
const Profile = lazy(() => import('@/pages/settings/Settings'));
const ChangePassword = lazy(() => import('@/pages/settings/ChangePassword'));
const Notifications = lazy(() => import('@/pages/settings/Notifications'));
const Referrals = lazy(() => import('@/pages/referrals/Referrals'));
const SellNumber = lazy(() => import('@/pages/sell/SellNumber'));

const EmployeeDashboard = lazy(() => import('@/pages/employee/EmployeeDashboard'));
const EmployeeNumbers = lazy(() => import('@/pages/employee/EmployeeNumbers'));
const EmployeeSellRequests = lazy(() => import('@/pages/employee/EmployeeSellRequests'));
const EmployeeUsers = lazy(() => import('@/pages/employee/EmployeeUsers'));
const EmployeeSubmissions = lazy(() => import('@/pages/employee/EmployeeSubmissions'));

const DealerDashboard = lazy(() => import('@/pages/dealer/DealerDashboard'));
const DealerListings = lazy(() => import('@/pages/dealer/DealerListings'));
const DealerListingForm = lazy(() => import('@/pages/dealer/DealerListingForm'));
const DealerSales = lazy(() => import('@/pages/dealer/DealerSales'));
const DealerPayouts = lazy(() => import('@/pages/dealer/DealerPayouts'));
const DealerProfile = lazy(() => import('@/pages/dealer/DealerProfile'));

const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminNumbers = lazy(() => import('@/pages/admin/AdminNumbers'));
const AdminOrders = lazy(() => import('@/pages/admin/AdminOrders'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminDealers = lazy(() => import('@/pages/admin/AdminDealers'));
const AdminPayouts = lazy(() => import('@/pages/admin/AdminPayouts'));
const AdminReviews = lazy(() => import('@/pages/admin/AdminReviews'));
const AdminTestimonials = lazy(() => import('@/pages/admin/AdminTestimonials'));
const AdminBanners = lazy(() => import('@/pages/admin/AdminBanners'));
const CarouselEditor = lazy(() => import('@/pages/admin/carousel/CarouselEditor'));
const AdminMessages = lazy(() => import('@/pages/admin/AdminMessages'));
const AdminCoupons = lazy(() => import('@/pages/admin/AdminCoupons'));
const AdminSubscribers = lazy(() => import('@/pages/admin/AdminSubscribers'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));
const AdminSellRequests = lazy(() => import('@/pages/admin/AdminSellRequests'));
const AdminApprovals = lazy(() => import('@/pages/admin/AdminApprovals'));
const AdminCreateDealer = lazy(() => import('@/pages/admin/AdminCreateDealer'));

const dealerRoles = ['DEALER', 'ADMIN'];
const adminRoles = ['ADMIN'];
const employeeRoles = ['EMPLOYEE', 'ADMIN'];

function StandalonePage({ children }: { children: ReactNode }) {
  const location = useLocation();
  return <MotionPage routeKey={location.pathname}>{children}</MotionPage>;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="grid min-h-[45vh] place-items-center bg-background text-foreground"><div className="text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" /><p className="mt-3 text-sm font-bold text-muted-foreground">Loading screen…</p></div></div>}>
    <Routes>
      {/* Storefront */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/number/:id" element={<NumberDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/numerology" element={<Numerology />} />
        <Route path="/wishlist" element={<RoleGuard><Wishlist /></RoleGuard>} />
        <Route path="/checkout" element={<RoleGuard><Checkout /></RoleGuard>} />
      </Route>

      {/* Auth */}
      <Route path="/login" element={<StandalonePage><Auth mode="login" /></StandalonePage>} />
      <Route path="/register" element={<StandalonePage><Auth mode="register" /></StandalonePage>} />
      <Route path="/forgot" element={<StandalonePage><Auth mode="forgot" /></StandalonePage>} />

      {/* Distraction-free admin studio (intentionally outside AccountLayout) */}
      <Route path="/admin/carousel/new" element={<RoleGuard roles={adminRoles}><CarouselEditor /></RoleGuard>} />
      <Route path="/admin/carousel/:id/edit" element={<RoleGuard roles={adminRoles}><CarouselEditor /></RoleGuard>} />

      {/* Account / dashboards */}
      <Route element={<RoleGuard><AccountLayout /></RoleGuard>}>
        <Route path="/dashboard" element={<BuyerDashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/account" element={<Profile />} />
        <Route path="/account/change-password" element={<ChangePassword />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/referrals" element={<Referrals />} />
        <Route path="/sell" element={<RoleGuard permission="user.sell"><SellNumber /></RoleGuard>} />

        {/* Employee */}
        <Route path="/employee" element={<RoleGuard roles={employeeRoles}><EmployeeDashboard /></RoleGuard>} />
        <Route path="/employee/numbers" element={<RoleGuard roles={employeeRoles}><EmployeeNumbers /></RoleGuard>} />
        <Route path="/employee/sell" element={<RoleGuard roles={employeeRoles}><EmployeeSellRequests /></RoleGuard>} />
        <Route path="/employee/users" element={<RoleGuard roles={employeeRoles}><EmployeeUsers /></RoleGuard>} />
        <Route path="/employee/submissions" element={<RoleGuard roles={employeeRoles}><EmployeeSubmissions /></RoleGuard>} />

        {/* Dealer */}
        <Route path="/dealer" element={<RoleGuard roles={dealerRoles}><DealerDashboard /></RoleGuard>} />
        <Route path="/dealer/listings" element={<RoleGuard roles={dealerRoles}><DealerListings /></RoleGuard>} />
        <Route path="/dealer/listings/new" element={<RoleGuard roles={dealerRoles}><DealerListingForm /></RoleGuard>} />
        <Route path="/dealer/listings/:id/edit" element={<RoleGuard roles={dealerRoles}><DealerListingForm /></RoleGuard>} />
        <Route path="/dealer/sales" element={<RoleGuard roles={dealerRoles}><DealerSales /></RoleGuard>} />
        <Route path="/dealer/payouts" element={<RoleGuard roles={dealerRoles}><DealerPayouts /></RoleGuard>} />
        <Route path="/dealer/profile" element={<RoleGuard roles={dealerRoles}><DealerProfile /></RoleGuard>} />

        {/* Admin */}
        <Route path="/admin" element={<RoleGuard roles={adminRoles}><AdminDashboard /></RoleGuard>} />
        <Route path="/admin/numbers" element={<RoleGuard roles={adminRoles}><AdminNumbers /></RoleGuard>} />
        <Route path="/admin/categories" element={<RoleGuard roles={adminRoles}><Navigate to="/admin/numbers?notice=automatic-categories" replace /></RoleGuard>} />
        <Route path="/admin/orders" element={<RoleGuard roles={adminRoles}><AdminOrders /></RoleGuard>} />
        <Route path="/admin/users" element={<RoleGuard roles={adminRoles}><AdminUsers /></RoleGuard>} />
        <Route path="/admin/dealers" element={<RoleGuard roles={adminRoles}><AdminDealers /></RoleGuard>} />
        <Route path="/admin/dealers/new" element={<RoleGuard roles={adminRoles}><AdminCreateDealer /></RoleGuard>} />
        <Route path="/admin/sell-requests" element={<RoleGuard roles={adminRoles}><AdminSellRequests /></RoleGuard>} />
        <Route path="/admin/approvals" element={<RoleGuard roles={adminRoles}><AdminApprovals /></RoleGuard>} />
        <Route path="/admin/payouts" element={<RoleGuard roles={adminRoles}><AdminPayouts /></RoleGuard>} />
        <Route path="/admin/reviews" element={<RoleGuard roles={adminRoles}><AdminReviews /></RoleGuard>} />
        <Route path="/admin/testimonials" element={<RoleGuard roles={adminRoles}><AdminTestimonials /></RoleGuard>} />
        <Route path="/admin/carousel" element={<RoleGuard roles={adminRoles}><AdminBanners /></RoleGuard>} />
        <Route path="/admin/banners" element={<RoleGuard roles={adminRoles}><AdminBanners /></RoleGuard>} />
        <Route path="/admin/coupons" element={<RoleGuard roles={adminRoles}><AdminCoupons /></RoleGuard>} />
        <Route path="/admin/subscribers" element={<RoleGuard roles={adminRoles}><AdminSubscribers /></RoleGuard>} />
        <Route path="/admin/messages" element={<RoleGuard roles={adminRoles}><AdminMessages /></RoleGuard>} />
        <Route path="/admin/settings" element={<RoleGuard roles={adminRoles}><AdminSettings /></RoleGuard>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}
