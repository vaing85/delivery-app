import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  useTheme,
  useMediaQuery,
  SwipeableDrawer,
  Fab,
  Zoom,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  ShoppingCart as OrdersIcon,
  LocalShipping as DeliveriesIcon,
  People as UsersIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Person as ProfileIcon,
  Add as AddIcon,
  ArrowUpward as ScrollTopIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import useResponsive, { useMobileInteractions } from '@/hooks/useResponsive';

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, touchDevice } = useResponsive();
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useMobileInteractions();
  const { user, logout } = useAuthStore();
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [swipeStart, setSwipeStart] = useState<{ x: number; y: number } | null>(null);

  // Navigation items
  const navigationItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { label: 'Orders', icon: <OrdersIcon />, path: '/orders' },
    { label: 'Deliveries', icon: <DeliveriesIcon />, path: '/deliveries' },
    { label: 'Users', icon: <UsersIcon />, path: '/users' },
    { label: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
    { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    { label: 'Profile', icon: <ProfileIcon />, path: '/profile' },
  ];

  // Role-based navigation filtering
  const getFilteredNavigationItems = () => {
    if (!user) return navigationItems;
    
    switch (user.role) {
      case 'CUSTOMER':
        return navigationItems.filter(item => 
          ['Dashboard', 'Orders', 'Notifications', 'Profile'].includes(item.label)
        );
      case 'DRIVER':
        return navigationItems.filter(item => 
          ['Dashboard', 'Deliveries', 'Notifications', 'Profile'].includes(item.label)
        );
      case 'BUSINESS':
        return navigationItems.filter(item => 
          ['Dashboard', 'Orders', 'Deliveries', 'Notifications', 'Profile'].includes(item.label)
        );
      case 'ADMIN':
        return navigationItems;
      default:
        return navigationItems;
    }
  };

  // Handle drawer toggle
  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' ||
        (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  // Handle navigation
  const handleNavigation = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
    setDrawerOpen(false);
  };

  // Scroll to top functionality
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Touch swipe handling for drawer (using hook from useMobileInteractions)

  // Drawer content
  const drawerContent = (
    <Box
      sx={{
        width: 280,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      {/* Drawer Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" component="div">
            Delivery App
          </Typography>
          <IconButton onClick={toggleDrawer(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        {user && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {user.email}
          </Typography>
        )}
      </Box>

      {/* Navigation List */}
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {getFilteredNavigationItems().map((item) => (
          <ListItem
            key={item.label}
            button
            onClick={() => handleNavigation(item.path)}
            selected={location.pathname === item.path}
            sx={{
              mx: 1,
              borderRadius: 1,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: location.pathname === item.path ? 'inherit' : 'text.secondary',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Logout Button */}
      <List>
        <ListItem
          button
          onClick={handleLogout}
          sx={{
            mx: 1,
            borderRadius: 1,
            color: 'error.main',
            '&:hover': {
              bgcolor: 'error.light',
              color: 'error.contrastText',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  if (!isMobile) {
    // Return regular layout for desktop
    return <>{children}</>;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile App Bar */}
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={toggleDrawer(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {navigationItems.find(item => item.path === location.pathname)?.label || 'Delivery App'}
          </Typography>

          {/* Notifications Badge */}
          <IconButton color="inherit" onClick={() => navigate('/notifications')}>
            <Badge badgeContent={4} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 2,
          pb: 8, // Add padding bottom for FAB
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {children}
      </Box>

      {/* Floating Action Button for Create Order */}
      {user?.role !== 'CUSTOMER' && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
          onClick={() => navigate('/orders/create')}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Scroll to Top Button */}
      <Zoom in={showScrollTop}>
        <Fab
          size="small"
          color="secondary"
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            zIndex: 1000,
          }}
          onClick={scrollToTop}
        >
          <ScrollTopIcon />
        </Fab>
      </Zoom>

      {/* Swipeable Drawer */}
      <SwipeableDrawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        onOpen={toggleDrawer(true)}
        disableSwipeToOpen={false}
        swipeAreaWidth={20}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
      >
        {drawerContent}
      </SwipeableDrawer>
    </Box>
  );
};

export default MobileLayout;
