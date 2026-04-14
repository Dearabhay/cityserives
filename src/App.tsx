import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import CustomerHome from "./pages/CustomerHome";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import EmergencyDispatch from "./pages/EmergencyDispatch";
import SearchResults from "./pages/SearchResults";
import VendorDashboard from "./pages/VendorDashboard";
import VendorBookings from "./pages/VendorBookings";
import VendorServices from "./pages/VendorServices";
import VendorProfileSettings from "./pages/VendorProfileSettings";
import VendorProfile from "./pages/VendorProfile";
import ProfileSettings from "./pages/ProfileSettings";
import ReviewRating from "./pages/ReviewRating";
import BookingFlow from "./pages/BookingFlow";
import Notifications from "./pages/Notifications";
import BookingHistory from "./pages/BookingHistory";
import LiveTracking from "./pages/LiveTracking";
import SubscriptionPlans from "./pages/SubscriptionPlans";
import CustomerLayout from "./layouts/CustomerLayout";
import VendorLayout from "./layouts/VendorLayout";
import VendorWithdraw from "./pages/VendorWithdraw";
import RateCustomer from "./pages/RateCustomer";
import Support from "./pages/Support";
import VendorNavigate from "./pages/VendorNavigate";
import BookingChat from "./pages/BookingChat";
import FavoriteVendors from "./pages/FavoriteVendors";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminSOSAlerts from "./pages/AdminSOSAlerts";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminBookings from "./pages/AdminBookings";
import AdminRevenue from "./pages/AdminRevenue";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, userRole, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (userRole !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/onboarding" element={<Onboarding />} />
    <Route path="/login" element={<Login />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    {/* Customer routes */}
    <Route element={<ProtectedRoute><CustomerLayout /></ProtectedRoute>}>
      <Route path="/" element={<CustomerHome />} />
      <Route path="/search" element={<SearchResults />} />
      <Route path="/bookings" element={<BookingHistory />} />
      <Route path="/profile" element={<ProfileSettings />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/favorites" element={<FavoriteVendors />} />
      <Route path="/support" element={<Support />} />
    </Route>
    <Route path="/emergency" element={<ProtectedRoute><EmergencyDispatch /></ProtectedRoute>} />
    <Route path="/vendor-profile/:id" element={<ProtectedRoute><VendorProfile /></ProtectedRoute>} />
    <Route path="/book" element={<ProtectedRoute><BookingFlow /></ProtectedRoute>} />
    <Route path="/tracking/:bookingId" element={<ProtectedRoute><LiveTracking /></ProtectedRoute>} />
    <Route path="/subscriptions" element={<ProtectedRoute><SubscriptionPlans /></ProtectedRoute>} />
    <Route path="/review/:bookingId" element={<ProtectedRoute><ReviewRating /></ProtectedRoute>} />
    <Route path="/chat/:bookingId" element={<ProtectedRoute><BookingChat /></ProtectedRoute>} />
    {/* Vendor routes */}
    <Route element={<ProtectedRoute><VendorLayout /></ProtectedRoute>}>
      <Route path="/vendor" element={<VendorDashboard />} />
      <Route path="/vendor/bookings" element={<VendorBookings />} />
      <Route path="/vendor/services" element={<VendorServices />} />
      <Route path="/vendor/profile" element={<VendorProfileSettings />} />
      <Route path="/vendor/support" element={<Support />} />
      <Route path="/vendor/sos-alerts" element={<AdminSOSAlerts />} />
    </Route>
    <Route path="/vendor/withdraw" element={<ProtectedRoute><VendorWithdraw /></ProtectedRoute>} />
    <Route path="/vendor/rate-customer/:bookingId" element={<ProtectedRoute><RateCustomer /></ProtectedRoute>} />
    <Route path="/vendor/navigate/:bookingId" element={<ProtectedRoute><VendorNavigate /></ProtectedRoute>} />
    <Route path="/vendor/chat/:bookingId" element={<ProtectedRoute><BookingChat /></ProtectedRoute>} />
    {/* Admin routes */}
    <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/users" element={<AdminUsers />} />
      <Route path="/admin/bookings" element={<AdminBookings />} />
      <Route path="/admin/sos-alerts" element={<AdminSOSAlerts />} />
      <Route path="/admin/revenue" element={<AdminRevenue />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
