import React, { createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout Components
import Layout from '@/components/Layout/Layout';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';

// Pages
import LoginPage from '@/pages/Auth/LoginPage';
import BusinessLoginPage from '@/pages/Auth/BusinessLoginPage';
import RegisterPage from '@/pages/Auth/RegisterPage';
import DashboardPage from '@/pages/Dashboard/DashboardPage';
import BusinessDashboardPage from '@/pages/Business/BusinessDashboardPage';
import OrdersPage from '@/pages/Orders/OrdersPage';
import OrderDetailsPage from '@/pages/Orders/OrderDetailsPage';
import CreateOrderPage from '@/pages/Orders/CreateOrderPage';
import DeliveriesPage from '@/pages/Deliveries/DeliveriesPage';
import DeliveryDetailsPage from '@/pages/Deliveries/DeliveryDetailsPage';
import UsersPage from '@/pages/Users/UsersPage';
import UserProfilePage from '@/pages/Users/UserProfilePage';
import DriversPage from '@/pages/Drivers/DriversPage';
import DriverDetailsPage from '@/pages/Drivers/DriverDetailsPage';
import PaymentPage from '@/pages/Payments/PaymentPage';
import AnalyticsPage from '@/pages/Analytics/AnalyticsPage';
import RouteOptimizationPage from '@/pages/RouteOptimization/RouteOptimizationPage';
import ProfilePage from '@/pages/Profile/ProfilePage';
import NotificationsPage from '@/pages/Notifications/NotificationsPage';
import SettingsPage from '@/pages/Settings/SettingsPage';
import NotFoundPage from '@/pages/NotFound/NotFoundPage';

// Store
import { useAuthStore } from '@/store/authStore';

// Theme
import { lightTheme, darkTheme } from '@/styles/theme';
import { ThemeProvider as CustomThemeProvider } from '@/contexts/ThemeContext';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

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
                  path="/business/login" 
                  element={
                    isAuthenticated ? <Navigate to="/business" replace /> : <BusinessLoginPage />
                  } 
                />
                <Route 
                  path="/register" 
                  element={
                    isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
                  } 
                />

                {/* Protected Routes */}
                <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
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
          </Box>
        </ThemeProvider>
      </CustomThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
