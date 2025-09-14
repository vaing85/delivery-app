import React, { createContext, useContext, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '@/styles/accessibility.css';

// Layout Components
import Layout from '@/components/Layout/Layout';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';

// Critical pages - load immediately
import LoginPage from '@/pages/Auth/LoginPage';
import RegisterPage from '@/pages/Auth/RegisterPage';

// Lazy load heavy components
const DashboardPage = lazy(() => import('@/pages/Dashboard/DashboardPage'));
const BusinessDashboardPage = lazy(() => import('@/pages/Business/BusinessDashboardPage'));
const OrdersPage = lazy(() => import('@/pages/Orders/OrdersPage'));
const OrderDetailsPage = lazy(() => import('@/pages/Orders/OrderDetailsPage'));
const CreateOrderPage = lazy(() => import('@/pages/Orders/CreateOrderPage'));
const DeliveriesPage = lazy(() => import('@/pages/Deliveries/DeliveriesPage'));
const DeliveryDetailsPage = lazy(() => import('@/pages/Deliveries/DeliveryDetailsPage'));
const UsersPage = lazy(() => import('@/pages/Users/UsersPage'));
const UserProfilePage = lazy(() => import('@/pages/Users/UserProfilePage'));
const DriversPage = lazy(() => import('@/pages/Drivers/DriversPage'));
const DriverDetailsPage = lazy(() => import('@/pages/Drivers/DriverDetailsPage'));
const PaymentPage = lazy(() => import('@/pages/Payments/PaymentPage'));
const AnalyticsPage = lazy(() => import('@/pages/Analytics/AnalyticsPage'));
const RouteOptimizationPage = lazy(() => import('@/pages/RouteOptimization/RouteOptimizationPage'));
const ProfilePage = lazy(() => import('@/pages/Profile/ProfilePage'));
import NotificationsPage from '@/pages/Notifications/NotificationsPage';
import SettingsPage from '@/pages/Settings/SettingsPage';
import NotFoundPage from '@/pages/NotFound/NotFoundPage';

// Store
import { useAuthStore } from '@/store/authStore';

// Theme
import { lightTheme, darkTheme } from '@/styles/theme';
import { ThemeProvider as CustomThemeProvider } from '@/contexts/ThemeContext';
import ErrorBoundary from '@/components/ErrorHandling/ErrorBoundary';
import { ErrorProvider } from '@/components/ErrorHandling/GlobalErrorHandler';
import OfflineIndicator from '@/components/Offline/OfflineIndicator';
import { SecurityProvider } from '@/contexts/SecurityContext';

// Create enhanced query client with caching
import { createEnhancedQueryClient } from '@/utils/cacheManager';

const queryClient = createEnhancedQueryClient();

// Loading component for Suspense
const PageLoader = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="100vh"
    flexDirection="column"
  >
    <CircularProgress size={60} />
    <Box mt={2} textAlign="center">
    <Box component="span" sx={{ variant: 'body2', color: 'text.secondary' }}>
      Loading page...
    </Box>
    </Box>
  </Box>
);

function App() {
  const { isAuthenticated, user, initializeAuth, validateTokens } = useAuthStore();
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const [mode, setMode] = React.useState<'light' | 'dark'>(prefersDarkMode ? 'dark' : 'light');

  // Initialize auth store on app load
  React.useEffect(() => {
    initializeAuth();
    
    // Validate tokens after initialization
    if (isAuthenticated && !validateTokens()) {
      console.log('Invalid tokens detected, redirecting to login');
      window.location.href = '/login';
    }
  }, [initializeAuth, isAuthenticated, validateTokens]);

  const theme = React.useMemo(
    () => createTheme(mode === 'light' ? lightTheme : darkTheme),
    [mode]
  );

       return (
         <ErrorBoundary>
           <ErrorProvider>
             <SecurityProvider>
               <QueryClientProvider client={queryClient}>
                 <CustomThemeProvider>
                   <ThemeProvider theme={theme}>
                     <CssBaseline />
                     <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Router
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                  }}
                >
              <Routes>
                {/* Public Routes */}
                <Route 
                  path="/login" 
                  element={
                    isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
                  } 
                />
                <Route 
                  path="/register" 
                  element={
                    isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
                  } 
                />

                {/* Protected Routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Layout />
                    </Suspense>
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="orders" element={<OrdersPage />} />
                  <Route path="orders/create" element={<CreateOrderPage />} />
                  <Route path="orders/:orderId" element={<OrderDetailsPage />} />
                  <Route path="orders/:orderId/payment" element={<PaymentPage />} />
                  <Route path="deliveries" element={<DeliveriesPage />} />
                  <Route path="deliveries/:deliveryId" element={<DeliveryDetailsPage />} />
                  
                  {/* Notifications Route */}
                  <Route path="notifications" element={<NotificationsPage />} />
                  
                  {/* Analytics Route */}
                  <Route path="analytics" element={<AnalyticsPage />} />
                  
                  {/* Route Optimization Route - Accessible by DRIVER, BUSINESS, and ADMIN roles */}
                  {(user?.role === 'DRIVER' || user?.role === 'BUSINESS' || user?.role === 'ADMIN') && (
                    <Route path="route-optimization" element={<RouteOptimizationPage />} />
                  )}
                  
                  {/* Profile Route */}
                  <Route path="profile" element={<ProfilePage />} />
                  
                  {/* Business Dashboard - Accessible by BUSINESS role */}
                  {user?.role === 'BUSINESS' && (
                    <Route path="business" element={<BusinessDashboardPage />} />
                  )}

                  {/* Drivers Route - Accessible by BUSINESS and ADMIN roles */}
                  {(user?.role === 'BUSINESS' || user?.role === 'ADMIN') && (
                    <>
                      <Route path="drivers" element={<DriversPage />} />
                      <Route path="drivers/:driverId" element={<DriverDetailsPage />} />
                    </>
                  )}

                  {/* Admin Only Routes */}
                  {user?.role === 'ADMIN' && (
                    <>
                      <Route path="business" element={<BusinessDashboardPage />} />
                      <Route path="business/create" element={<BusinessDashboardPage />} />
                      <Route path="users" element={<UsersPage />} />
                      <Route path="users/:userId" element={<UserProfilePage />} />
                    </>
                  )}
                  
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Router>

                     {/* Global Toast Notifications */}
                     <ToastContainer
                       position="top-right"
                       autoClose={5000}
                       hideProgressBar={false}
                       newestOnTop={false}
                       closeOnClick
                       rtl={false}
                       pauseOnFocusLoss
                       draggable
                       pauseOnHover
                       theme={mode}
                     />
                     
                     {/* Offline Indicator */}
                     <OfflineIndicator />
                   </Box>
                 </ThemeProvider>
               </CustomThemeProvider>
             </QueryClientProvider>
           </SecurityProvider>
         </ErrorProvider>
       </ErrorBoundary>
       );
}

export default App;
