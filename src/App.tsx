import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import VendorPayouts from "./pages/vendor/VendorPayouts";
import OrderDetail from "./pages/vendor/OrderDetail";
import BookingsDashboard from "./pages/vendor/BookingsDashboard";
import ServiceIntelligence from "./pages/vendor/ServiceIntelligence";
import ServiceAutomation from "./pages/vendor/ServiceAutomation";
import Riders from "./pages/Riders";
import Layout from "@/components/layout/Layout";
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
import Checkout from "./pages/Checkout";
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
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Keep the landing page standalone to avoid double header/hero */}
            <Route path="/" element={<Index />} />

            {/* Shared layout for all other routes */}
            <Route element={<Layout />}>
              <Route path="/getting-started" element={<GettingStarted />} />
              <Route path="/auth" element={<Auth />} />
              
              <Route path="/catalog" element={<Navigate to="/products" replace />} />
              <Route path="/food" element={<Navigate to="/products?filter=prepared_food" replace />} />
              <Route path="/groceries" element={<Navigate to="/products?filter=grocery" replace />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/services" element={<Navigate to="/products?type=services" replace />} />
              <Route path="/products" element={<UnifiedCatalog />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/service/:id" element={<ServiceDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/delivery-details" element={<DeliveryDetails />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderTracker />} />
              <Route path="/orders/:id/return" element={<RequestReturn />} />
              <Route path="/orders/:id/cancel" element={<RequestCancellation />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/communities" element={<Communities />} />
              <Route path="/communities/:id" element={<CommunityDetail />} />
              <Route path="/communities/:id/feed" element={<CommunityFeed />} />
              <Route path="/communities/:id/manage" element={<CommunityManage />} />
              <Route path="/communities/:id/members" element={<CommunityMembers />} />
              <Route path="/communities/:id/contribute" element={<Contribute />} />
              <Route path="/riders" element={<Riders />} />
              <Route path="/rider" element={<RiderDashboard />} />
              <Route path="/rider/assignments" element={<RiderAssignments />} />
              <Route path="/rider/deliveries" element={<RiderDeliveries />} />
              <Route path="/rider/profile" element={<RiderProfile />} />
              <Route path="/rider/payouts" element={<RiderPayouts />} />

              {/* Messaging & Support */}
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/support" element={<SupportPage />} />
              
              <Route path="/vendor/services" element={<Navigate to="/vendor/listings?type=services" replace />} />
              <Route path="/vendor/services/new" element={<ServiceForm />} />
              <Route path="/vendor/services/:serviceId/edit" element={<ServiceForm />} />
              <Route path="/vendor/dashboard" element={<VendorDashboard />} />
              <Route path="/vendor/listings" element={<VendorListings />} />
              <Route path="/vendor/creator" element={<CreatorStudio />} />
              <Route path="/vendor/products" element={<Navigate to="/vendor/listings?type=products" replace />} />
              <Route path="/vendor/products/new" element={<ProductForm />} />
              <Route path="/vendor/products/:productId/edit" element={<ProductForm />} />
          <Route path="/vendor/orders" element={<VendorOrders />} />
          <Route path="/vendor/orders/:orderId" element={<OrderDetail />} />
          <Route path="/vendor/bookings" element={<BookingsDashboard />} />
          <Route path="/vendor/intelligence" element={<ServiceIntelligence />} />
          <Route path="/vendor/automation" element={<ServiceAutomation />} />
              <Route path="/vendor/analytics" element={<VendorAnalytics />} />
              <Route path="/vendor/calendar" element={<VendorCalendar />} />
              <Route path="/vendor/payouts" element={<VendorPayouts />} />
              <Route path="/vendor/settings" element={<VendorSettings />} />
              <Route path="/vendor/returns" element={<VendorReturnRequests />} />
              <Route path="/vendor/cancellations" element={<VendorCancellationRequests />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/community-payment-success" element={<CommunityPaymentSuccess />} />
              <Route path="/payment-canceled" element={<PaymentCanceled />} />
              <Route path="/store/:vendorId" element={<StoreFront />} />
              <Route
                path="/admin"
                element={
                  <RequireAdmin>
                    <AdminLayout>
                      <Dashboard />
                    </AdminLayout>
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/finance"
                element={
                  <RequireAdmin>
                    <AdminLayout>
                      <Finance />
                    </AdminLayout>
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/kyc"
                element={
                  <RequireAdmin>
                    <AdminLayout>
                      <AdminKYC />
                    </AdminLayout>
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/kyc-requirements"
                element={
                  <RequireAdmin>
                    <AdminLayout>
                      <AdminKYCRequirements />
                    </AdminLayout>
                  </RequireAdmin>
                }
              />

              {/* Super Admin routes */}
              <Route
                path="/superadmin"
                element={
                  <RequireSuperadmin>
                    <SuperAdminLayout>
                      <SuperAdminDashboard />
                    </SuperAdminLayout>
                  </RequireSuperadmin>
                }
              />
              <Route
                path="/superadmin/platform"
                element={
                  <RequireSuperadmin>
                    <PlatformManagement />
                  </RequireSuperadmin>
                }
              />
              <Route
                path="/superadmin/communications"
                element={
                  <RequireSuperadmin>
                    <Communications />
                  </RequireSuperadmin>
                }
              />
              <Route
                path="/superadmin/finance"
                element={
                  <RequireSuperadmin>
                    <FinancialControl />
                  </RequireSuperadmin>
                }
              />
              <Route
                path="/superadmin/verification"
                element={
                  <RequireSuperadmin>
                    <Verification />
                  </RequireSuperadmin>
                }
              />
              <Route
                path="/superadmin/audit-logs"
                element={
                  <RequireSuperadmin>
                    <AuditLogs />
                  </RequireSuperadmin>
                }
              />
              <Route
                path="/superadmin/testimonials"
                element={
                  <RequireSuperadmin>
                    <TestimonialsManagement />
                  </RequireSuperadmin>
                }
              />
              <Route
                path="/superadmin/statistics"
                element={
                  <RequireSuperadmin>
                    <StatisticsManagement />
                  </RequireSuperadmin>
                }
              />
              <Route
                path="/superadmin/trust"
                element={
                  <RequireSuperadmin>
                    <TrustManagement />
                  </RequireSuperadmin>
                }
              />
              <Route
                path="/superadmin/content"
                element={
                  <RequireSuperadmin>
                    <PageContentManagement />
                  </RequireSuperadmin>
                }
              />
              <Route
                path="/superadmin/process-steps"
                element={
                  <RequireSuperadmin>
                    <ProcessStepsManagement />
                  </RequireSuperadmin>
                }
              />

              {/* Legacy routes for backward compatibility - redirect or keep for direct access */}
              <Route
                path="/superadmin/users"
                element={
                  <RequireSuperadmin>
                    <PlatformManagement />
                  </RequireSuperadmin>
                }
              />
              <Route
                path="/superadmin/settings"
                element={
                  <RequireSuperadmin>
                    <PlatformManagement />
                  </RequireSuperadmin>
                }
              />
              <Route
                path="/superadmin/feature-flags"
                element={
                  <RequireSuperadmin>
                    <PlatformManagement />
                  </RequireSuperadmin>
                }
              />
              <Route
                path="/superadmin/categories"
                element={
                  <RequireSuperadmin>
                    <PlatformManagement />
                  </RequireSuperadmin>
                }
              />
              <Route
                path="/superadmin/announcements"
                element={
                  <RequireSuperadmin>
                    <Communications />
                  </RequireSuperadmin>
                }
              />
              <Route
                path="/superadmin/reports"
                element={
                  <RequireSuperadmin>
                    <Communications />
                  </RequireSuperadmin>
                }
              />
              <Route
                path="/admin"
                element={
                  <RequireSuperadmin>
                    <FinancialControl />
                  </RequireSuperadmin>
                }
              />
              <Route
                path="/admin/finance"
                element={
                  <RequireSuperadmin>
                    <FinancialControl />
                  </RequireSuperadmin>
                }
              />
              <Route
                path="/admin/kyc"
                element={
                  <RequireSuperadmin>
                    <Verification />
                  </RequireSuperadmin>
                }
              />
              <Route
                path="/admin/kyc-requirements"
                element={
                  <RequireSuperadmin>
                    <Verification />
                  </RequireSuperadmin>
                }
              />

              {/* Catch-all inside layout */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
