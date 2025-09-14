import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Button, IconButton, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import { Menu as MenuIcon, AccountCircle, LightMode, DarkMode, Refresh as RefreshIcon } from '@mui/icons-material';
import { useAuthStore } from '@/store/authStore';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import Sidebar from './Sidebar';
import RealTimeNotificationCenter from '../Notifications/RealTimeNotificationCenter';
import MobileLayout from '../Mobile/MobileLayout';
import useResponsive from '@/hooks/useResponsive';


const Layout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { mode, toggleColorMode } = useCustomTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isMobile } = useResponsive();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));



  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Use mobile layout for mobile devices
  if (isMobile) {
    return (
      <MobileLayout>
        <Outlet />
        <RealTimeNotificationCenter />
      </MobileLayout>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Only show sidebar for admin and driver users */}
      {(user?.role === 'ADMIN' || user?.role === 'DRIVER') && (
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}
      
      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            {/* Only show hamburger menu for admin and driver users */}
            {(user?.role === 'ADMIN' || user?.role === 'DRIVER') && (
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 2 }}
                onClick={toggleSidebar}
              >
                <MenuIcon />
              </IconButton>
            )}
            

            
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Delivery App
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Real-time Notification Center - Only for Admin users */}
              {user?.role === 'ADMIN' && (
                <RealTimeNotificationCenter />
              )}
              {/* Debug: Show user role */}
              {process.env.NODE_ENV === 'development' && (
                <Typography variant="caption" sx={{ color: 'white' }}>
                  Role: {user?.role}
                </Typography>
              )}
              
              <Tooltip title="Toggle Theme">
                <IconButton
                  size="large"
                  color="inherit"
                  onClick={toggleColorMode}
                >
                  {mode === 'dark' ? <LightMode /> : <DarkMode />}
                </IconButton>
              </Tooltip>
              
              {user ? (
                <>
                  <Typography variant="body2">
                    {user.firstName} {user.lastName}
                  </Typography>
                  <Tooltip title="Profile">
                    <IconButton
                      size="large"
                      aria-label="account"
                      aria-controls="menu-appbar"
                      aria-haspopup="true"
                      color="inherit"
                      onClick={() => navigate('/profile')}
                    >
                      <AccountCircle />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Refresh Data">
                    <IconButton
                      size="large"
                      color="inherit"
                      onClick={() => window.location.reload()}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  <Button color="inherit" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              ) : (
                <Button color="inherit" onClick={() => navigate('/login')}>
                  Login
                </Button>
              )}
            </Box>
          </Toolbar>
        </AppBar>
        
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
