import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ShoppingCart as OrdersIcon,
  LocalShipping as DeliveriesIcon,
  People as UsersIcon,
  Settings as SettingsIcon,
  Business as BusinessIcon,
  Person as ProfileIcon,
  Logout as LogoutIcon,
  Analytics as AnalyticsIcon,
  Route as RouteIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  { text: 'Dashboard', icon: DashboardIcon, path: '/dashboard' },
  { text: 'Orders', icon: OrdersIcon, path: '/orders' },
  { text: 'Deliveries', icon: DeliveriesIcon, path: '/deliveries' },
  { text: 'Analytics', icon: AnalyticsIcon, path: '/analytics' },
  { text: 'Route Optimization', icon: RouteIcon, path: '/route-optimization', roles: ['DRIVER', 'BUSINESS', 'ADMIN'] },
  { text: 'Users', icon: UsersIcon, path: '/users' },
  { text: 'Business', icon: BusinessIcon, path: '/business', adminOnly: true },
  { text: 'Profile', icon: ProfileIcon, path: '/profile' },
  { text: 'Settings', icon: SettingsIcon, path: '/settings' }
];

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      ModalProps={{
        disableEnforceFocus: true, // Prevent focus issues with aria-hidden
      }}
      sx={{
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" color="primary">
          Delivery App
        </Typography>
      </Box>
      
      <Divider />
      
      <List>
        {menuItems
          .filter((item) => {
            if (item.adminOnly && user?.role !== 'ADMIN') return false;
            if (item.roles && !item.roles.includes(user?.role || '')) return false;
            return true;
          })
          .map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={isActive}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive ? 'inherit' : 'text.primary' }}>
                  <Icon />
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      
      <Divider />
      
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;
