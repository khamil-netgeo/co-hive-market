import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProductionErrorBoundary } from "@/components/common/ProductionErrorBoundary";
import { AccessibilityProvider } from "@/components/common/AccessibilityProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import Catalog from "./pages/Catalog";
import UnifiedCatalog from "./pages/UnifiedCatalog";
import ProductDetail from "./pages/ProductDetail";
import ServiceDetail from "./pages/ServiceDetail";
import Feed from "./pages/Feed";
import Orders from "./pages/Orders";
import OrderTracker from "./pages/OrderTracker";
import VendorOrders from "./pages/vendor/VendorOrders";
import VendorAnalytics from "./pages/vendor/VendorAnalytics";
import VendorAnalyticsAdvanced from "./pages/vendor/VendorAnalyticsAdvanced";
import VendorPayouts from "./pages/vendor/VendorPayouts";
import Inventory from "./pages/vendor/Inventory";
import OrderDetail from "./pages/vendor/OrderDetail";
import BookingsDashboard from "./pages/vendor/BookingsDashboard";
import ServiceIntelligence from "./pages/vendor/ServiceIntelligence";
import ServiceAutomation from "./pages/vendor/ServiceAutomation";
import Riders from "./pages/Riders";
import Layout from "@/components/layout/Layout";
import UnifiedHeader from "@/components/layout/UnifiedHeader";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import RequireAdmin from "./components/auth/RequireAdmin";
import RequireSuperadmin from "./components/auth/RequireSuperadmin";
import SuperAdminLayout from "./pages/superadmin/SuperAdminLayout";
import SuperAdminDashboard from "./pages/superadmin/Dashboard";
import UsersRoles from "./pages/superadmin/UsersRoles";
import GlobalSettings from "./pages/superadmin/GlobalSettings";
import FeatureFlags from "./pages/superadmin/FeatureFlags";
import Announcements from "./pages/superadmin/Announcements";
import AuditLogs from "./pages/superadmin/AuditLogs";
import ContentReports from "./pages/superadmin/ContentReports";
import Categories from "./pages/superadmin/Categories";
import PlatformManagement from "./pages/superadmin/PlatformManagement";
import Communications from "./pages/superadmin/Communications";
import FinancialControl from "./pages/superadmin/FinancialControl";
import Verification from "./pages/superadmin/Verification";
import Finance from "./pages/admin/Finance";
import AdminKYC from "./pages/admin/KYC";
import AdminKYCRequirements from "./pages/admin/KYCRequirements";
import TestimonialsManagement from "./pages/superadmin/TestimonialsManagement";
import StatisticsManagement from "./pages/superadmin/StatisticsManagement";
import TrustManagement from "./pages/superadmin/TrustManagement";
import PageContentManagement from "./pages/superadmin/PageContentManagement";
import ProcessStepsManagement from "./pages/superadmin/ProcessStepsManagement";
import CategoriesManagement from "./pages/superadmin/CategoriesManagement";
import RolesManagement from "./pages/superadmin/RolesManagement";
import GettingStarted from "./pages/GettingStarted";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import ProductForm from "./pages/vendor/ProductForm";
import Profile from "./pages/Profile";
import Communities from "./pages/Communities";
import CommunityDetail from "./pages/communities/CommunityDetail";
import CommunityManage from "./pages/communities/CommunityManage";
import CommunityFeed from "./pages/communities/CommunityFeed";
import Services from "./pages/Services";
import VendorServices from "./pages/vendor/Services";
import VendorProducts from "./pages/vendor/VendorProducts";
import ServiceForm from "./pages/vendor/ServiceForm";
import Cart from "./pages/Cart";
import VendorSettings from "./pages/vendor/VendorSettings";
import VendorReviews from "./pages/vendor/VendorReviews";
import Checkout from "./pages/Checkout";
import CheckoutNew from "./pages/CheckoutNew";
import DeliveryDetails from "./pages/DeliveryDetails";
import RiderDashboard from "./pages/rider/Dashboard";
import RiderAssignments from "./pages/rider/Assignments";
import RiderDeliveries from "./pages/rider/Deliveries";
import RiderProfile from "./pages/rider/Profile";
import RiderPayouts from "./pages/rider/Payouts";
import VendorListings from "./pages/vendor/Listings";
import CreatorStudio from "./pages/vendor/CreatorStudio";
import VendorCalendar from "./pages/vendor/Calendar";
import { CartProvider } from "@/hooks/useCart";
import ChatPage from "./pages/Chat";
import SupportPage from "./pages/Support";
import Contribute from "./pages/communities/Contribute";
import CommunityPaymentSuccess from "./pages/CommunityPaymentSuccess";
import CommunityMembers from "./pages/communities/CommunityMembers";
import RequestReturn from "./pages/RequestReturn";
import RequestCancellation from "./pages/RequestCancellation";
import VendorReturnRequests from "./pages/vendor/ReturnRequests";
import VendorCancellationRequests from "./pages/vendor/CancellationRequests";
import StoreFront from "./pages/StoreFront";

const queryClient = new QueryClient();

const App = () => (
  <ProductionErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <AccessibilityProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/auth" element={<Auth />} />
                
                {/* Routes that use Layout wrapper */}
                <Route element={<Layout />}>
                  <Route index element={<Index />} />
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/communities" element={<Communities />} />
                  <Route path="/communities/:id" element={<CommunityDetail />} />
                  <Route path="/communities/:id/feed" element={<CommunityFeed />} />
                  <Route path="/communities/:id/manage" element={<CommunityManage />} />
                  <Route path="/communities/:id/members" element={<CommunityMembers />} />
                  <Route path="/communities/:id/contribute" element={<Contribute />} />
                  <Route path="/community-payment-success" element={<CommunityPaymentSuccess />} />
                  <Route path="/products" element={<Navigate to="/catalog" replace />} />
                  <Route path="/catalog" element={<Catalog />} />
                  <Route path="/unified-catalog" element={<UnifiedCatalog />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/feed" element={<Feed />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/checkout-new" element={<CheckoutNew />} />
                  <Route path="/payment-success" element={<PaymentSuccess />} />
                  <Route path="/payment-canceled" element={<PaymentCanceled />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/order-tracker/:orderId" element={<OrderTracker />} />
                  <Route path="/delivery-details/:orderId" element={<DeliveryDetails />} />
                  <Route path="/request-return/:orderId" element={<RequestReturn />} />
                  <Route path="/request-cancellation/:orderId" element={<RequestCancellation />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/support" element={<SupportPage />} />
                  <Route path="/getting-started" element={<GettingStarted />} />
                  <Route path="/products/:productId" element={<ProductDetail />} />
                  <Route path="/services/:serviceId" element={<ServiceDetail />} />
                  <Route path="/store/:vendorId" element={<StoreFront />} />
                  <Route path="/riders" element={<Riders />} />

                  {/* Vendor Dashboard Routes */}
                  <Route path="/vendor" element={<Navigate to="/vendor/dashboard" replace />} />
                  <Route path="/vendor/dashboard" element={<VendorDashboard />} />
                  <Route path="/vendor/products" element={<VendorProducts />} />
                  <Route path="/vendor/products/new" element={<ProductForm />} />
                  <Route path="/vendor/products/edit/:id" element={<ProductForm />} />
                  <Route path="/vendor/services" element={<Services />} />
                  <Route path="/vendor/services/new" element={<ServiceForm />} />
                  <Route path="/vendor/services/edit/:id" element={<ServiceForm />} />
                  <Route path="/vendor/orders" element={<VendorOrders />} />
                  <Route path="/vendor/orders/:orderId" element={<OrderDetail />} />
                  <Route path="/vendor/analytics" element={<VendorAnalytics />} />
                  <Route path="/vendor/analytics/advanced" element={<VendorAnalyticsAdvanced />} />
                  <Route path="/vendor/inventory" element={<Inventory />} />
                  <Route path="/vendor/reviews" element={<VendorReviews />} />
                  <Route path="/vendor/payouts" element={<VendorPayouts />} />
                  <Route path="/vendor/settings" element={<VendorSettings />} />
                  <Route path="/vendor/listings" element={<VendorListings />} />
                  <Route path="/vendor/cancellation-requests" element={<VendorCancellationRequests />} />
                  <Route path="/vendor/return-requests" element={<VendorReturnRequests />} />
                  <Route path="/vendor/bookings" element={<BookingsDashboard />} />
                  <Route path="/vendor/calendar" element={<VendorCalendar />} />
                  <Route path="/vendor/creator-studio" element={<CreatorStudio />} />
                  <Route path="/vendor/service-automation" element={<ServiceAutomation />} />
                  <Route path="/vendor/service-intelligence" element={<ServiceIntelligence />} />

                  {/* Rider Routes */}
                  <Route path="/rider" element={<Navigate to="/rider/dashboard" replace />} />
                  <Route path="/rider/dashboard" element={<RiderDashboard />} />
                  <Route path="/rider/deliveries" element={<RiderDeliveries />} />
                  <Route path="/rider/assignments" element={<RiderAssignments />} />
                  <Route path="/rider/payouts" element={<RiderPayouts />} />
                  <Route path="/rider/profile" element={<RiderProfile />} />

                  {/* Admin Routes */}
                  <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                    <Route path="/admin/dashboard" element={<Dashboard />} />
                    <Route path="/admin/kyc" element={<AdminKYC />} />
                    <Route path="/admin/kyc-requirements" element={<AdminKYCRequirements />} />
                    <Route path="/admin/finance" element={<Finance />} />
                  </Route>

                  {/* Super Admin Routes */}
                  <Route element={<RequireSuperadmin><SuperAdminLayout /></RequireSuperadmin>}>
                    <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
                    <Route path="/superadmin/users-roles" element={<UsersRoles />} />
                    <Route path="/superadmin/roles-management" element={<RolesManagement />} />
                    <Route path="/superadmin/categories" element={<Categories />} />
                    <Route path="/superadmin/categories-management" element={<CategoriesManagement />} />
                    <Route path="/superadmin/verification" element={<Verification />} />
                    <Route path="/superadmin/financial-control" element={<FinancialControl />} />
                    <Route path="/superadmin/platform-management" element={<PlatformManagement />} />
                    <Route path="/superadmin/global-settings" element={<GlobalSettings />} />
                    <Route path="/superadmin/feature-flags" element={<FeatureFlags />} />
                    <Route path="/superadmin/audit-logs" element={<AuditLogs />} />
                    <Route path="/superadmin/communications" element={<Communications />} />
                    <Route path="/superadmin/announcements" element={<Announcements />} />
                    <Route path="/superadmin/content-reports" element={<ContentReports />} />
                    <Route path="/superadmin/page-content" element={<PageContentManagement />} />
                    <Route path="/superadmin/testimonials" element={<TestimonialsManagement />} />
                    <Route path="/superadmin/statistics" element={<StatisticsManagement />} />
                    <Route path="/superadmin/process-steps" element={<ProcessStepsManagement />} />
                    <Route path="/superadmin/trust-management" element={<TrustManagement />} />
                  </Route>
                </Route>

                {/* 404 Not Found */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ProductionErrorBoundary>
);

export default App;