import { Routes, Route, Navigate } from 'react-router-dom';
import { RoleGuard } from './RoleGuard';
import PublicLayout from '@/shared/layout/PublicLayout';
import AccountLayout from '@/shared/layout/AccountLayout';

// Public
import Home from '@/pages/home/Home';
import Shop from '@/pages/shop/Shop';
import NumberDetail from '@/pages/shop/NumberDetail';
import Cart from '@/pages/cart/Cart';
import Wishlist from '@/pages/wishlist/Wishlist';
import Compare from '@/pages/compare/Compare';
import Checkout from '@/pages/checkout/Checkout';
import About from '@/pages/static/About';
import Contact from '@/pages/static/Contact';
import Numerology from '@/pages/numerology/Numerology';
import Auth from '@/pages/auth/Auth';
import NotFound from '@/pages/not-found';

// Buyer
import BuyerDashboard from '@/pages/dashboard/Dashboard';
import Orders from '@/pages/orders/Orders';
import OrderDetail from '@/pages/orders/OrderDetail';
import Profile from '@/pages/settings/Settings';
import ChangePassword from '@/pages/settings/ChangePassword';
import Notifications from '@/pages/settings/Notifications';
import Referrals from '@/pages/referrals/Referrals';
import SellNumber from '@/pages/sell/SellNumber';

// Employee
import EmployeeDashboard from '@/pages/employee/EmployeeDashboard';
import EmployeeNumbers from '@/pages/employee/EmployeeNumbers';
import EmployeeSellRequests from '@/pages/employee/EmployeeSellRequests';
import EmployeeUsers from '@/pages/employee/EmployeeUsers';
import EmployeeSubmissions from '@/pages/employee/EmployeeSubmissions';

// Dealer
import DealerDashboard from '@/pages/dealer/DealerDashboard';
import DealerListings from '@/pages/dealer/DealerListings';
import DealerListingForm from '@/pages/dealer/DealerListingForm';
import DealerSales from '@/pages/dealer/DealerSales';
import DealerPayouts from '@/pages/dealer/DealerPayouts';
import DealerProfile from '@/pages/dealer/DealerProfile';

// Admin
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminNumbers from '@/pages/admin/AdminNumbers';
import AdminCategories from '@/pages/admin/AdminCategories';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminDealers from '@/pages/admin/AdminDealers';
import AdminPayouts from '@/pages/admin/AdminPayouts';
import AdminReviews from '@/pages/admin/AdminReviews';
import AdminTestimonials from '@/pages/admin/AdminTestimonials';
import AdminBanners from '@/pages/admin/AdminBanners';
import AdminMessages from '@/pages/admin/AdminMessages';
import AdminCoupons from '@/pages/admin/AdminCoupons';
import AdminSubscribers from '@/pages/admin/AdminSubscribers';
import AdminSettings from '@/pages/admin/AdminSettings';
import AdminSellRequests from '@/pages/admin/AdminSellRequests';
import AdminApprovals from '@/pages/admin/AdminApprovals';
import AdminCreateDealer from '@/pages/admin/AdminCreateDealer';

const dealerRoles = ['DEALER', 'ADMIN'];
const adminRoles = ['ADMIN'];
const employeeRoles = ['EMPLOYEE', 'ADMIN'];

export default function AppRoutes() {
  return (
    <Routes>
      {/* Storefront */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
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
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/register" element={<Auth mode="register" />} />
      <Route path="/forgot" element={<Auth mode="forgot" />} />

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
        <Route path="/admin/categories" element={<RoleGuard roles={adminRoles}><AdminCategories /></RoleGuard>} />
        <Route path="/admin/orders" element={<RoleGuard roles={adminRoles}><AdminOrders /></RoleGuard>} />
        <Route path="/admin/users" element={<RoleGuard roles={adminRoles}><AdminUsers /></RoleGuard>} />
        <Route path="/admin/dealers" element={<RoleGuard roles={adminRoles}><AdminDealers /></RoleGuard>} />
        <Route path="/admin/dealers/new" element={<RoleGuard roles={adminRoles}><AdminCreateDealer /></RoleGuard>} />
        <Route path="/admin/sell-requests" element={<RoleGuard roles={adminRoles}><AdminSellRequests /></RoleGuard>} />
        <Route path="/admin/approvals" element={<RoleGuard roles={adminRoles}><AdminApprovals /></RoleGuard>} />
        <Route path="/admin/payouts" element={<RoleGuard roles={adminRoles}><AdminPayouts /></RoleGuard>} />
        <Route path="/admin/reviews" element={<RoleGuard roles={adminRoles}><AdminReviews /></RoleGuard>} />
        <Route path="/admin/testimonials" element={<RoleGuard roles={adminRoles}><AdminTestimonials /></RoleGuard>} />
        <Route path="/admin/banners" element={<RoleGuard roles={adminRoles}><AdminBanners /></RoleGuard>} />
        <Route path="/admin/coupons" element={<RoleGuard roles={adminRoles}><AdminCoupons /></RoleGuard>} />
        <Route path="/admin/subscribers" element={<RoleGuard roles={adminRoles}><AdminSubscribers /></RoleGuard>} />
        <Route path="/admin/messages" element={<RoleGuard roles={adminRoles}><AdminMessages /></RoleGuard>} />
        <Route path="/admin/settings" element={<RoleGuard roles={adminRoles}><AdminSettings /></RoleGuard>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
