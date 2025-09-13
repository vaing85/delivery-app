import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Badge,
  Tooltip,
  Alert,
  Snackbar,
  Avatar,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  NotificationsActive as ActiveNotificationIcon,
  NotificationsOff as InactiveNotificationIcon,
  Settings as SettingsIcon,
  MarkAsUnread as MarkUnreadIcon,
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  LocalShipping as DeliveryIcon,
  ShoppingCart as OrderIcon,
  AttachMoney as PaymentIcon
} from '@mui/icons-material';
import { useWebSocket } from '../../services/websocketService';
import { notificationsAPI } from '../../services/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'ORDER_UPDATE' | 'DELIVERY_STATUS' | 'PAYMENT' | 'SYSTEM' | 'PROMOTION';
  severity: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  createdAt: Date;
  data?: any;
  userId: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  orderUpdates: boolean;
  deliveryStatus: boolean;
  paymentAlerts: boolean;
  systemAlerts: boolean;
  promotions: boolean;
}

const EnhancedNotificationSystem: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    orderUpdates: true,
    deliveryStatus: true,
    paymentAlerts: true,
    systemAlerts: true,
    promotions: false
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });

  // Mock data for demonstration
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Order Confirmed',
        message: 'Your order #ORD-001 has been confirmed and is being prepared.',
        type: 'ORDER_UPDATE',
        severity: 'success',
        isRead: false,
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
        userId: 'user1'
      },
      {
        id: '2',
        title: 'Delivery In Progress',
        message: 'Your delivery #DEL-002 is on its way. Expected arrival: 2:30 PM',
        type: 'DELIVERY_STATUS',
        severity: 'info',
        isRead: false,
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
        userId: 'user1'
      },
      {
        id: '3',
        title: 'Payment Processed',
        message: 'Payment of $45.99 for order #ORD-001 has been processed successfully.',
        type: 'PAYMENT',
        severity: 'success',
        isRead: true,
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        userId: 'user1'
      },
      {
        id: '4',
        title: 'System Maintenance',
        message: 'Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM EST.',
        type: 'SYSTEM',
        severity: 'warning',
        isRead: true,
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
        userId: 'user1'
      },
      {
        id: '5',
        title: 'Special Promotion',
        message: 'Get 20% off your next delivery! Use code SAVE20 at checkout.',
        type: 'PROMOTION',
        severity: 'info',
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        userId: 'user1'
      }
    ];
    setNotifications(mockNotifications);
  }, []);

  // Filter notifications based on current filters
  useEffect(() => {
    let filtered = notifications;

    // Filter by read status
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.isRead);
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.isRead);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredNotifications(filtered);
  }, [notifications, filter, typeFilter, searchQuery]);

  const getNotificationIcon = (type: string, severity: string) => {
    const iconProps = { fontSize: 'small' as const };
    
    switch (type) {
      case 'ORDER_UPDATE':
        return <OrderIcon {...iconProps} />;
      case 'DELIVERY_STATUS':
        return <DeliveryIcon {...iconProps} />;
      case 'PAYMENT':
        return <PaymentIcon {...iconProps} />;
      case 'SYSTEM':
        return <SettingsIcon {...iconProps} />;
      case 'PROMOTION':
        return <InfoIcon {...iconProps} />;
      default:
        return <NotificationIcon {...iconProps} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success': return '#4caf50';
      case 'warning': return '#ff9800';
      case 'error': return '#f44336';
      default: return '#2196f3';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    setSnackbar({ open: true, message: 'Notification marked as read', severity: 'success' });
  };

  const markAsUnread = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: false } : n)
    );
    setSnackbar({ open: true, message: 'Notification marked as unread', severity: 'success' });
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setSnackbar({ open: true, message: 'Notification deleted', severity: 'success' });
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setSnackbar({ open: true, message: 'All notifications marked as read', severity: 'success' });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Typography variant="h5" component="h2">
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Badge badgeContent={unreadCount} color="error" sx={{ ml: 2 }}>
              <NotificationIcon />
            </Badge>
          )}
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setSettingsOpen(true)}
            sx={{ mr: 1 }}
          >
            Settings
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setComposeOpen(true)}
          >
            Compose
          </Button>
        </Box>
      </Box>

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filter}
                label="Status"
                onChange={(e) => setFilter(e.target.value as any)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="unread">Unread</MenuItem>
                <MenuItem value="read">Read</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="ORDER_UPDATE">Order Updates</MenuItem>
                <MenuItem value="DELIVERY_STATUS">Delivery Status</MenuItem>
                <MenuItem value="PAYMENT">Payments</MenuItem>
                <MenuItem value="SYSTEM">System</MenuItem>
                <MenuItem value="PROMOTION">Promotions</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark All Read
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Notifications List */}
      <Paper>
        <List>
          {filteredNotifications.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="No notifications found"
                secondary="Try adjusting your filters or check back later"
              />
            </ListItem>
          ) : (
            filteredNotifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                    '&:hover': { backgroundColor: 'action.selected' }
                  }}
                >
                  <ListItemIcon>
                    <Avatar
                      sx={{
                        bgcolor: getSeverityColor(notification.severity),
                        width: 32,
                        height: 32
                      }}
                    >
                      {getNotificationIcon(notification.type, notification.severity)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: notification.isRead ? 'normal' : 'bold' }}
                        >
                          {notification.title}
                        </Typography>
                        <Chip
                          label={notification.type.replace('_', ' ')}
                          size="small"
                          variant="outlined"
                        />
                        {!notification.isRead && (
                          <Chip
                            label="New"
                            size="small"
                            color="primary"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(notification.createdAt)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box display="flex" gap={1}>
                      <Tooltip title={notification.isRead ? "Mark as unread" : "Mark as read"}>
                        <IconButton
                          size="small"
                          onClick={() => 
                            notification.isRead ? markAsUnread(notification.id) : markAsRead(notification.id)
                          }
                        >
                          {notification.isRead ? <MarkUnreadIcon /> : <MarkReadIcon />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < filteredNotifications.length - 1 && <Divider />}
              </React.Fragment>
            ))
          )}
        </List>
      </Paper>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Notification Settings</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Delivery Methods
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.pushNotifications}
                    onChange={(e) => setSettings(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                  />
                }
                label="Push Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.smsNotifications}
                    onChange={(e) => setSettings(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                  />
                }
                label="SMS Notifications"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Notification Types
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.orderUpdates}
                    onChange={(e) => setSettings(prev => ({ ...prev, orderUpdates: e.target.checked }))}
                  />
                }
                label="Order Updates"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.deliveryStatus}
                    onChange={(e) => setSettings(prev => ({ ...prev, deliveryStatus: e.target.checked }))}
                  />
                }
                label="Delivery Status"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.paymentAlerts}
                    onChange={(e) => setSettings(prev => ({ ...prev, paymentAlerts: e.target.checked }))}
                  />
                }
                label="Payment Alerts"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.systemAlerts}
                    onChange={(e) => setSettings(prev => ({ ...prev, systemAlerts: e.target.checked }))}
                  />
                }
                label="System Alerts"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.promotions}
                    onChange={(e) => setSettings(prev => ({ ...prev, promotions: e.target.checked }))}
                  />
                }
                label="Promotions"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setSettingsOpen(false)}>
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onClose={() => setComposeOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Compose Notification</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                variant="outlined"
                placeholder="Enter notification title"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Message"
                variant="outlined"
                multiline
                rows={3}
                placeholder="Enter notification message"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select label="Type">
                  <MenuItem value="ORDER_UPDATE">Order Update</MenuItem>
                  <MenuItem value="DELIVERY_STATUS">Delivery Status</MenuItem>
                  <MenuItem value="PAYMENT">Payment</MenuItem>
                  <MenuItem value="SYSTEM">System</MenuItem>
                  <MenuItem value="PROMOTION">Promotion</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select label="Severity">
                  <MenuItem value="info">Info</MenuItem>
                  <MenuItem value="success">Success</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComposeOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setComposeOpen(false)}>
            Send Notification
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EnhancedNotificationSystem;
