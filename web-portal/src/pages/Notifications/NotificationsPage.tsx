import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Button,
  Divider,
  Badge,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Circle as PrimaryIcon,
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { notificationsAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  data?: {
    orderId: string;
    orderNumber: string;
  };
  createdAt: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <SuccessIcon color="success" />;
    case 'warning':
      return <WarningIcon color="warning" />;
    case 'error':
      return <ErrorIcon color="error" />;
    case 'primary':
      return <PrimaryIcon color="primary" />;
    default:
      return <InfoIcon color="info" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    case 'primary':
      return 'primary';
    default:
      return 'info';
  }
};

const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const { isAuthenticated, user } = useAuthStore();

  // Fetch notifications
  const { data: notificationsData, isPending, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await notificationsAPI.getNotifications({ limit: 50 });
      return response;
    },
    enabled: isAuthenticated
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await notificationsAPI.updateNotification(notificationId, { isRead: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification marked as read');
    },
    onError: () => {
      toast.error('Failed to mark notification as read');
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await notificationsAPI.markAllAsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
    onError: () => {
      toast.error('Failed to mark all notifications as read');
    }
  });

  // Handle mark as read
  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Handle notification selection
  const handleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId) 
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedNotifications.length === notificationsData?.data.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notificationsData?.data.map((n: any) => n.id) || []);
    }
  };

  // Show loading state if not authenticated
  if (!isAuthenticated) {
    return (
      <Box p={3}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={40} />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load notifications. Please try again.
        </Alert>
      </Box>
    );
  }

  const unreadCount = notificationsData?.data.filter((n: any) => !n.isRead).length || 0;

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h4" component="h1">
            Notifications
          </Typography>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationIcon color="action" />
          </Badge>
        </Box>
        
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending || unreadCount === 0}
            startIcon={<MarkReadIcon />}
          >
            Mark All as Read
          </Button>
        </Box>
      </Box>

      {/* Customer-specific Notification Summary */}
      {user?.role === 'CUSTOMER' && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Notification Summary
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="error.main">
                  {notificationsData?.data.filter((n: any) => !n.isRead).length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Unread
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary.main">
                  {notificationsData?.data.filter((n: any) => n.type === 'DELIVERY_UPDATE').length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Delivery Updates
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="info.main">
                  {notificationsData?.data.filter((n: any) => n.type === 'ORDER_STATUS').length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Order Updates
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {notificationsData?.data.filter((n: any) => n.type === 'PROMOTION').length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Promotions
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Notification Filters */}

      {/* Notifications List */}
      <Paper>
        {isPending ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : notificationsData?.data.length === 0 ? (
          <Box p={4} textAlign="center">
            <Typography variant="body1" color="text.secondary">
              No notifications found
            </Typography>
          </Box>
        ) : (
          <List>
            {notificationsData.data.map((notification: any, index: number) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={notification.title}
                    secondary={notification.message}
                  />
                  <Box display="flex" alignItems="center" gap={2} ml={2}>
                    <Chip
                      label={notification.type}
                      color={getNotificationColor(notification.type) as any}
                      size="small"
                    />
                    {!notification.isRead && (
                      <Chip label="New" color="error" size="small" />
                    )}
                  </Box>
                  <Box display="flex" flexDirection="column" ml={2}>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(notification.createdAt).toLocaleString()}
                    </Typography>
                    {notification.data && (
                      <Typography variant="caption" color="primary">
                        Order: {notification.data.orderNumber}
                      </Typography>
                    )}
                  </Box>
                  
                  <Box display="flex" gap={1}>
                    {!notification.isRead && (
                      <IconButton
                        size="small"
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={markAsReadMutation.isPending}
                        title="Mark as read"
                      >
                        <MarkReadIcon />
                      </IconButton>
                    )}
                  </Box>
                </ListItem>
                
                {index < notificationsData.data.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default NotificationsPage;
