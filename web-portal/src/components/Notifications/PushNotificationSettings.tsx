import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Switch,
  FormControlLabel,
  Box,
  Button,
  Alert,
  Snackbar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  NotificationsOff as NotificationOffIcon,
  Settings as SettingsIcon,
  TestTube as TestIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { usePushNotifications } from '../../services/pushNotificationService';
import { useAuthStore } from '../../stores/authStore';

interface PushNotificationSettingsProps {
  onClose?: () => void;
}

const PushNotificationSettings: React.FC<PushNotificationSettingsProps> = ({ onClose }) => {
  const {
    isSupported,
    permission,
    subscription,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    testNotification
  } = usePushNotifications();

  const { user } = useAuthStore();
  const [settings, setSettings] = useState({
    orderUpdates: true,
    deliveryStatus: true,
    driverNotifications: true,
    systemAlerts: true,
    marketing: false
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  const handleSettingChange = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handlePermissionRequest = async () => {
    try {
      const result = await requestPermission();
      if (result.granted) {
        setSnackbar({
          open: true,
          message: 'Notification permission granted!',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Notification permission denied. You can enable it in your browser settings.',
          severity: 'warning'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to request notification permission.',
        severity: 'error'
      });
    }
  };

  const handleSubscribe = async () => {
    try {
      const newSubscription = await subscribe();
      if (newSubscription && user) {
        // Send subscription to server
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({
            subscription: newSubscription.toJSON(),
            userId: user.id
          })
        });

        setSnackbar({
          open: true,
          message: 'Successfully subscribed to push notifications!',
          severity: 'success'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to subscribe to push notifications.',
        severity: 'error'
      });
    }
  };

  const handleUnsubscribe = async () => {
    try {
      const success = await unsubscribe();
      if (success && user) {
        // Remove subscription from server
        await fetch('/api/notifications/unsubscribe', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({ userId: user.id })
        });

        setSnackbar({
          open: true,
          message: 'Successfully unsubscribed from push notifications.',
          severity: 'success'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to unsubscribe from push notifications.',
        severity: 'error'
      });
    }
  };

  const handleTestNotification = async () => {
    try {
      await testNotification();
      setSnackbar({
        open: true,
        message: 'Test notification sent!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to send test notification.',
        severity: 'error'
      });
    }
  };

  const getPermissionStatus = () => {
    switch (permission.permission) {
      case 'granted':
        return { color: 'success', icon: <CheckIcon />, text: 'Granted' };
      case 'denied':
        return { color: 'error', icon: <ErrorIcon />, text: 'Denied' };
      default:
        return { color: 'warning', icon: <InfoIcon />, text: 'Not Requested' };
    }
  };

  const permissionStatus = getPermissionStatus();

  if (!isSupported) {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning" icon={<NotificationOffIcon />}>
            Push notifications are not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader
          title="Push Notification Settings"
          subheader="Manage your notification preferences"
          avatar={<SettingsIcon color="primary" />}
        />
        <CardContent>
          {/* Permission Status */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Permission Status
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Chip
                icon={permissionStatus.icon}
                label={permissionStatus.text}
                color={permissionStatus.color as any}
                variant="outlined"
              />
              {permission.permission !== 'granted' && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={handlePermissionRequest}
                  disabled={isLoading}
                >
                  Request Permission
                </Button>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Subscription Status */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Subscription Status
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Chip
                icon={subscription ? <CheckIcon /> : <ErrorIcon />}
                label={subscription ? 'Subscribed' : 'Not Subscribed'}
                color={subscription ? 'success' : 'default'}
                variant="outlined"
              />
              {permission.granted && (
                <Box>
                  {subscription ? (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={handleUnsubscribe}
                      disabled={isLoading}
                    >
                      Unsubscribe
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleSubscribe}
                      disabled={isLoading}
                    >
                      Subscribe
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Notification Types */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Notification Types
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <NotificationIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Order Updates"
                  secondary="Get notified when your orders are updated"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.orderUpdates}
                      onChange={() => handleSettingChange('orderUpdates')}
                      disabled={!subscription}
                    />
                  }
                  label=""
                />
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <NotificationIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Delivery Status"
                  secondary="Receive updates about delivery progress"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.deliveryStatus}
                      onChange={() => handleSettingChange('deliveryStatus')}
                      disabled={!subscription}
                    />
                  }
                  label=""
                />
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <NotificationIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Driver Notifications"
                  secondary="Important notifications for drivers"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.driverNotifications}
                      onChange={() => handleSettingChange('driverNotifications')}
                      disabled={!subscription}
                    />
                  }
                  label=""
                />
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <NotificationIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="System Alerts"
                  secondary="Critical system notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.systemAlerts}
                      onChange={() => handleSettingChange('systemAlerts')}
                      disabled={!subscription}
                    />
                  }
                  label=""
                />
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <NotificationIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Marketing"
                  secondary="Promotional offers and updates"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.marketing}
                      onChange={() => handleSettingChange('marketing')}
                      disabled={!subscription}
                    />
                  }
                  label=""
                />
              </ListItem>
            </List>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Test Notification */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" gutterBottom>
                Test Notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Send a test notification to verify everything is working
              </Typography>
            </Box>
            <Tooltip title="Send test notification">
              <IconButton
                onClick={handleTestNotification}
                disabled={!subscription || isLoading}
                color="primary"
              >
                <TestIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Help Text */}
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Push notifications help you stay updated with important delivery information even when the app is not open.
              You can manage these settings at any time.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

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
    </>
  );
};

export default PushNotificationSettings;
