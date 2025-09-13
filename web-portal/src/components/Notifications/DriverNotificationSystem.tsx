import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Badge,
  Alert,
  Snackbar,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  NotificationsActive as NotificationActiveIcon,
  NotificationsOff as NotificationOffIcon,
  LocalShipping as DeliveryIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Settings as SettingsIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Vibration as VibrationIcon,
  Message as MessageIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

interface DriverNotificationSystemProps {
  driverId: string;
}

interface Notification {
  id: string;
  type: 'new_order' | 'order_update' | 'payment' | 'rating' | 'system' | 'emergency';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  isUrgent: boolean;
  actionRequired: boolean;
  orderId?: string;
  customerId?: string;
  data?: any;
}

interface NotificationSettings {
  newOrders: boolean;
  orderUpdates: boolean;
  payments: boolean;
  ratings: boolean;
  systemAlerts: boolean;
  emergencyAlerts: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  pushEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

const DriverNotificationSystem: React.FC<DriverNotificationSystemProps> = ({ driverId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    newOrders: true,
    orderUpdates: true,
    payments: true,
    ratings: true,
    systemAlerts: true,
    emergencyAlerts: true,
    soundEnabled: true,
    vibrationEnabled: true,
    pushEnabled: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00'
    }
  });
  const [showSettings, setShowSettings] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });

  // Mock notifications data
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'new_order',
        title: 'New Delivery Assignment',
        message: 'You have been assigned a new delivery order #ORD-001234',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        isRead: false,
        isUrgent: true,
        actionRequired: true,
        orderId: 'ORD-001234',
        customerId: 'CUST-001'
      },
      {
        id: '2',
        type: 'order_update',
        title: 'Order Status Updated',
        message: 'Order #ORD-001233 has been updated to "Ready for Pickup"',
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        isRead: false,
        isUrgent: false,
        actionRequired: false,
        orderId: 'ORD-001233'
      },
      {
        id: '3',
        type: 'rating',
        title: 'New Customer Rating',
        message: 'You received a 5-star rating from John Smith',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        isRead: true,
        isUrgent: false,
        actionRequired: false,
        customerId: 'CUST-002'
      },
      {
        id: '4',
        type: 'payment',
        title: 'Payment Received',
        message: 'Your weekly payment of $245 has been processed',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        isRead: true,
        isUrgent: false,
        actionRequired: false
      },
      {
        id: '5',
        type: 'system',
        title: 'App Update Available',
        message: 'A new version of the driver app is available for download',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        isRead: true,
        isUrgent: false,
        actionRequired: false
      }
    ];
    setNotifications(mockNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_order': return <DeliveryIcon color="primary" />;
      case 'order_update': return <InfoIcon color="info" />;
      case 'payment': return <TrendingUpIcon color="success" />;
      case 'rating': return <StarIcon color="warning" />;
      case 'system': return <SettingsIcon color="default" />;
      case 'emergency': return <WarningIcon color="error" />;
      default: return <NotificationIcon />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_order': return 'primary';
      case 'order_update': return 'info';
      case 'payment': return 'success';
      case 'rating': return 'warning';
      case 'system': return 'default';
      case 'emergency': return 'error';
      default: return 'default';
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setSnackbar({
      open: true,
      message: 'All notifications marked as read',
      severity: 'success'
    });
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDetails(true);
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
  };

  const handleAcceptOrder = (orderId: string) => {
    setSnackbar({
      open: true,
      message: `Order ${orderId} accepted successfully`,
      severity: 'success'
    });
    // In a real app, you would make an API call here
  };

  const handleDeclineOrder = (orderId: string) => {
    setSnackbar({
      open: true,
      message: `Order ${orderId} declined`,
      severity: 'info'
    });
    // In a real app, you would make an API call here
  };

  const handleSettingsChange = (key: keyof NotificationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleQuietHoursChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      quietHours: { ...prev.quietHours, [key]: value }
    }));
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Badge badgeContent={unreadCount} color="error">
            <NotificationIcon color="primary" sx={{ mr: 1 }} />
          </Badge>
          <Typography variant="h5">
            Notifications
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button 
            variant="outlined" 
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark All Read
          </Button>
          <IconButton onClick={() => setShowSettings(true)}>
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Notification List */}
      <List>
        {notifications.map((notification, index) => (
          <React.Fragment key={notification.id}>
            <ListItem
              sx={{
                backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.selected'
                }
              }}
              onClick={() => handleNotificationClick(notification)}
            >
              <ListItemIcon>
                <Box position="relative">
                  {getNotificationIcon(notification.type)}
                  {notification.isUrgent && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: 'error.main'
                      }}
                    />
                  )}
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle1" fontWeight={notification.isRead ? 'normal' : 'bold'}>
                      {notification.title}
                    </Typography>
                    {notification.isUrgent && (
                      <Chip label="Urgent" color="error" size="small" />
                    )}
                    {notification.actionRequired && (
                      <Chip label="Action Required" color="warning" size="small" />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {notification.timestamp.toLocaleString()}
                    </Typography>
                  </Box>
                }
              />
              {!notification.isRead && (
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main'
                  }}
                />
              )}
            </ListItem>
            {index < notifications.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>

      {notifications.length === 0 && (
        <Box textAlign="center" py={4}>
          <NotificationOffIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You're all caught up!
          </Typography>
        </Box>
      )}

      {/* Notification Details Dialog */}
      <Dialog open={showDetails} onClose={() => setShowDetails(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            {selectedNotification && getNotificationIcon(selectedNotification.type)}
            <Typography variant="h6">
              {selectedNotification?.title}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedNotification && (
            <Box>
              <Typography variant="body1" gutterBottom>
                {selectedNotification.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedNotification.timestamp.toLocaleString()}
              </Typography>
              
              {selectedNotification.actionRequired && selectedNotification.type === 'new_order' && (
                <Box mt={3}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    This order requires your response. Please accept or decline.
                  </Alert>
                  <Box display="flex" gap={2}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => {
                        handleAcceptOrder(selectedNotification.orderId!);
                        setShowDetails(false);
                      }}
                    >
                      Accept Order
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => {
                        handleDeclineOrder(selectedNotification.orderId!);
                        setShowDetails(false);
                      }}
                    >
                      Decline Order
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <SettingsIcon />
            <Typography variant="h6">Notification Settings</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Notification Types
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.newOrders}
                    onChange={(e) => handleSettingsChange('newOrders', e.target.checked)}
                  />
                }
                label="New Order Assignments"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.orderUpdates}
                    onChange={(e) => handleSettingsChange('orderUpdates', e.target.checked)}
                  />
                }
                label="Order Status Updates"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.payments}
                    onChange={(e) => handleSettingsChange('payments', e.target.checked)}
                  />
                }
                label="Payment Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.ratings}
                    onChange={(e) => handleSettingsChange('ratings', e.target.checked)}
                  />
                }
                label="Customer Ratings"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.systemAlerts}
                    onChange={(e) => handleSettingsChange('systemAlerts', e.target.checked)}
                  />
                }
                label="System Alerts"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emergencyAlerts}
                    onChange={(e) => handleSettingsChange('emergencyAlerts', e.target.checked)}
                  />
                }
                label="Emergency Alerts"
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom>
              Notification Preferences
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.soundEnabled}
                    onChange={(e) => handleSettingsChange('soundEnabled', e.target.checked)}
                  />
                }
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    {settings.soundEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
                    Sound Notifications
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.vibrationEnabled}
                    onChange={(e) => handleSettingsChange('vibrationEnabled', e.target.checked)}
                  />
                }
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <VibrationIcon />
                    Vibration
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.pushEnabled}
                    onChange={(e) => handleSettingsChange('pushEnabled', e.target.checked)}
                  />
                }
                label="Push Notifications"
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom>
              Quiet Hours
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.quietHours.enabled}
                  onChange={(e) => handleQuietHoursChange('enabled', e.target.checked)}
                />
              }
              label="Enable Quiet Hours"
            />
            {settings.quietHours.enabled && (
              <Box display="flex" gap={2} mt={1}>
                <TextField
                  label="Start Time"
                  type="time"
                  value={settings.quietHours.start}
                  onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                  size="small"
                />
                <TextField
                  label="End Time"
                  type="time"
                  value={settings.quietHours.end}
                  onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                  size="small"
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Close</Button>
          <Button variant="contained">Save Settings</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default DriverNotificationSystem;
