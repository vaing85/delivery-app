import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Badge,
  Chip,
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
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Tooltip,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  LocalShipping as DriverIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Description as TemplateIcon,
  Wifi as OnlineIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useWebSocket } from '../../services/websocketService';
import { useAuthStore } from '../../store/authStore';
import { notificationsAPI } from '../../services/api';
import { toast } from 'react-toastify';

interface RealTimeNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  data?: any;
  timestamp: string;
  expiresAt?: string;
  actionRequired?: boolean;
  actionUrl?: string;
  actionText?: string;
  user?: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  variables: string[];
  isActive: boolean;
}

interface OnlineUsers {
  total: number;
  byRole: {
    admin: number;
    driver: number;
    customer: number;
    business: number;
  };
}

const RealTimeNotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUsers>({ total: 0, byRole: { admin: 0, driver: 0, customer: 0, business: 0 } });
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [composeOpen, setComposeOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });

  // Form states
  const [composeForm, setComposeForm] = useState({
    title: '',
    message: '',
    type: 'SYSTEM',
    priority: 'MEDIUM',
    userId: '',
    data: {},
    actionRequired: false,
    actionUrl: '',
    actionText: ''
  });

  const [templateForm, setTemplateForm] = useState({
    templateId: '',
    userId: '',
    variables: {} as Record<string, string>
  });

  const [scheduleForm, setScheduleForm] = useState({
    ...composeForm,
    scheduledFor: ''
  });

  const [settings, setSettings] = useState({
    autoMarkRead: true,
    soundEnabled: true,
    desktopNotifications: true,
    emailNotifications: true,
    pushNotifications: true
  });

  const { user } = useAuthStore();
  const token = localStorage.getItem('token');
  const { setEventHandlers, isConnected } = useWebSocket();
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load initial data
  useEffect(() => {
    loadNotifications();
    loadTemplates();
    loadOnlineUsers();
    loadSettings();
  }, []);

  // Set up WebSocket event handlers
  useEffect(() => {
    if (isConnected) {
      setEventHandlers({
        onNotification: (data: RealTimeNotification) => {
          handleNewNotification(data);
        }
      });
    }
  }, [isConnected, setEventHandlers]);

  const loadNotifications = async () => {
    try {
      const response = await notificationsAPI.getNotifications({ limit: 50 });
      if (response.success) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/real-time-notifications/templates', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadOnlineUsers = async () => {
    try {
      const response = await fetch('/api/real-time-notifications/online-users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setOnlineUsers(data.data);
      }
    } catch (error) {
      console.error('Error loading online users:', error);
    }
  };

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const saveSettings = () => {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
    setSnackbar({ open: true, message: 'Settings saved successfully', severity: 'success' });
  };

  const handleNewNotification = (notification: RealTimeNotification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Play sound if enabled
    if (settings.soundEnabled && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }

    // Show desktop notification if enabled
    if (settings.desktopNotifications && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico'
        });
      }
    }

    // Show toast notification
    toast.info(notification.message, {
      position: 'top-right',
      autoClose: 5000
    });
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsAPI.updateNotification(notificationId, { isRead: true });
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationsAPI.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const sendNotification = async () => {
    try {
      const response = await fetch('/api/real-time-notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(composeForm)
      });

      const data = await response.json();
      if (data.success) {
        setSnackbar({ open: true, message: 'Notification sent successfully', severity: 'success' });
        setComposeOpen(false);
        setComposeForm({
          title: '',
          message: '',
          type: 'SYSTEM',
          priority: 'MEDIUM',
          userId: '',
          data: {},
          actionRequired: false,
          actionUrl: '',
          actionText: ''
        });
      } else {
        setSnackbar({ open: true, message: data.message || 'Failed to send notification', severity: 'error' });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setSnackbar({ open: true, message: 'Failed to send notification', severity: 'error' });
    }
  };

  const sendTemplateNotification = async () => {
    try {
      const response = await fetch('/api/real-time-notifications/template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(templateForm)
      });

      const data = await response.json();
      if (data.success) {
        setSnackbar({ open: true, message: 'Template notification sent successfully', severity: 'success' });
        setTemplateOpen(false);
        setTemplateForm({ templateId: '', userId: '', variables: {} });
      } else {
        setSnackbar({ open: true, message: data.message || 'Failed to send template notification', severity: 'error' });
      }
    } catch (error) {
      console.error('Error sending template notification:', error);
      setSnackbar({ open: true, message: 'Failed to send template notification', severity: 'error' });
    }
  };

  const scheduleNotification = async () => {
    try {
      const response = await fetch('/api/real-time-notifications/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...scheduleForm,
          scheduledFor: new Date(scheduleForm.scheduledFor).toISOString()
        })
      });

      const data = await response.json();
      if (data.success) {
        setSnackbar({ open: true, message: 'Notification scheduled successfully', severity: 'success' });
        setScheduleOpen(false);
        setScheduleForm({
          ...composeForm,
          scheduledFor: ''
        });
      } else {
        setSnackbar({ open: true, message: data.message || 'Failed to schedule notification', severity: 'error' });
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
      setSnackbar({ open: true, message: 'Failed to schedule notification', severity: 'error' });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'default';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ORDER_UPDATE': return '📦';
      case 'DELIVERY_STATUS': return '🚚';
      case 'PAYMENT': return '💳';
      case 'SYSTEM': return '⚙️';
      case 'DRIVER_ALERT': return '👨‍💼';
      case 'CUSTOMER_ALERT': return '👤';
      case 'ADMIN_ALERT': return '👑';
      default: return '📢';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <PersonIcon />;
      case 'DRIVER': return <DriverIcon />;
      case 'CUSTOMER': return <PersonIcon />;
      case 'BUSINESS': return <BusinessIcon />;
      default: return <PersonIcon />;
    }
  };

  // Debug logging
  console.log('RealTimeNotificationCenter rendered', { user, unreadCount });

  return (
    <Box>
      {/* Notification Bell */}
      <Tooltip title="Real-time Notifications">
        <IconButton onClick={() => setIsOpen(true)} color="inherit">
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      {/* Audio element for notification sounds */}
      <audio ref={audioRef} preload="auto">
        <source src="/notification-sound.mp3" type="audio/mpeg" />
      </audio>

      {/* Main Dialog */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '80vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Real-time Notification Center</Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                icon={<OnlineIcon />}
                label={`${onlineUsers.total} Online`}
                color={isConnected ? 'success' : 'error'}
                size="small"
              />
              <IconButton onClick={() => setIsOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="Notifications" />
            <Tab label="Send Notification" />
            <Tab label="Templates" />
            <Tab label="Schedule" />
            <Tab label="Settings" />
          </Tabs>

          {/* Notifications Tab */}
          {activeTab === 0 && (
            <Box mt={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Notifications</Typography>
                <Button
                  variant="outlined"
                  startIcon={<MarkReadIcon />}
                  onClick={() => {
                    notifications.forEach(n => markAsRead(n.id));
                  }}
                >
                  Mark All Read
                </Button>
              </Box>

              <List>
                {notifications.map((notification) => (
                  <ListItem key={notification.id} divider>
                    <ListItemIcon>
                      <Typography fontSize="1.5rem">
                        {getTypeIcon(notification.type)}
                      </Typography>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1">{notification.title}</Typography>
                          <Chip
                            label={notification.priority}
                            color={getPriorityColor(notification.priority) as any}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(notification.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box display="flex" gap={1}>
                      {notification.actionRequired && (
                        <Button
                          size="small"
                          variant="contained"
                          href={notification.actionUrl}
                          target="_blank"
                        >
                          {notification.actionText || 'Take Action'}
                        </Button>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <MarkReadIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Send Notification Tab */}
          {activeTab === 1 && (
            <Box mt={2}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={composeForm.title}
                    onChange={(e) => setComposeForm({ ...composeForm, title: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="User ID (optional)"
                    value={composeForm.userId}
                    onChange={(e) => setComposeForm({ ...composeForm, userId: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Message"
                    value={composeForm.message}
                    onChange={(e) => setComposeForm({ ...composeForm, message: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={composeForm.type}
                      onChange={(e) => setComposeForm({ ...composeForm, type: e.target.value })}
                    >
                      <MenuItem value="ORDER_UPDATE">Order Update</MenuItem>
                      <MenuItem value="DELIVERY_STATUS">Delivery Status</MenuItem>
                      <MenuItem value="PAYMENT">Payment</MenuItem>
                      <MenuItem value="SYSTEM">System</MenuItem>
                      <MenuItem value="DRIVER_ALERT">Driver Alert</MenuItem>
                      <MenuItem value="CUSTOMER_ALERT">Customer Alert</MenuItem>
                      <MenuItem value="ADMIN_ALERT">Admin Alert</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={composeForm.priority}
                      onChange={(e) => setComposeForm({ ...composeForm, priority: e.target.value })}
                    >
                      <MenuItem value="LOW">Low</MenuItem>
                      <MenuItem value="MEDIUM">Medium</MenuItem>
                      <MenuItem value="HIGH">High</MenuItem>
                      <MenuItem value="URGENT">Urgent</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={composeForm.actionRequired}
                        onChange={(e) => setComposeForm({ ...composeForm, actionRequired: e.target.checked })}
                      />
                    }
                    label="Action Required"
                  />
                </Grid>
                {composeForm.actionRequired && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Action URL"
                        value={composeForm.actionUrl}
                        onChange={(e) => setComposeForm({ ...composeForm, actionUrl: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Action Text"
                        value={composeForm.actionText}
                        onChange={(e) => setComposeForm({ ...composeForm, actionText: e.target.value })}
                      />
                    </Grid>
                  </>
                )}
              </Grid>

              <Box mt={2} display="flex" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={sendNotification}
                  disabled={!composeForm.title || !composeForm.message}
                >
                  Send Now
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ScheduleIcon />}
                  onClick={() => {
                    setScheduleForm({ ...composeForm, scheduledFor: '' });
                    setScheduleOpen(true);
                  }}
                >
                  Schedule
                </Button>
              </Box>
            </Box>
          )}

          {/* Templates Tab */}
          {activeTab === 2 && (
            <Box mt={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Notification Templates</Typography>
                <Button
                  variant="outlined"
                  startIcon={<TemplateIcon />}
                  onClick={() => setTemplateOpen(true)}
                >
                  Use Template
                </Button>
              </Box>

              <Grid container spacing={2}>
                {templates.map((template) => (
                  <Grid item xs={12} md={6} key={template.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">{template.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {template.title}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {template.message}
                        </Typography>
                        <Box mt={2} display="flex" gap={1}>
                          <Chip label={template.type} size="small" />
                          <Chip label={template.priority} size="small" color={getPriorityColor(template.priority) as any} />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Schedule Tab */}
          {activeTab === 3 && (
            <Box mt={2}>
              <Typography variant="h6" mb={2}>Scheduled Notifications</Typography>
              <Alert severity="info">
                Scheduled notifications will be sent at the specified time. You can view and manage them here.
              </Alert>
            </Box>
          )}

          {/* Settings Tab */}
          {activeTab === 4 && (
            <Box mt={2}>
              <Typography variant="h6" mb={2}>Notification Settings</Typography>
              
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>General Settings</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.autoMarkRead}
                          onChange={(e) => setSettings({ ...settings, autoMarkRead: e.target.checked })}
                        />
                      }
                      label="Auto-mark notifications as read"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.soundEnabled}
                          onChange={(e) => setSettings({ ...settings, soundEnabled: e.target.checked })}
                        />
                      }
                      label="Enable notification sounds"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.desktopNotifications}
                          onChange={(e) => setSettings({ ...settings, desktopNotifications: e.target.checked })}
                        />
                      }
                      label="Enable desktop notifications"
                    />
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Online Users</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card>
                        <CardContent>
                          <Box display="flex" alignItems="center" gap={1}>
                            <PersonIcon />
                            <Typography variant="h6">{onlineUsers.byRole.admin}</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">Admins</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card>
                        <CardContent>
                          <Box display="flex" alignItems="center" gap={1}>
                            <DriverIcon />
                            <Typography variant="h6">{onlineUsers.byRole.driver}</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">Drivers</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card>
                        <CardContent>
                          <Box display="flex" alignItems="center" gap={1}>
                            <PersonIcon />
                            <Typography variant="h6">{onlineUsers.byRole.customer}</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">Customers</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card>
                        <CardContent>
                          <Box display="flex" alignItems="center" gap={1}>
                            <BusinessIcon />
                            <Typography variant="h6">{onlineUsers.byRole.business}</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">Businesses</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Box mt={2}>
                <Button variant="contained" onClick={saveSettings}>
                  Save Settings
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={templateOpen} onClose={() => setTemplateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Send Template Notification</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Template</InputLabel>
                <Select
                  value={templateForm.templateId}
                  onChange={(e) => setTemplateForm({ ...templateForm, templateId: e.target.value })}
                >
                  {templates.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="User ID"
                value={templateForm.userId}
                onChange={(e) => setTemplateForm({ ...templateForm, userId: e.target.value })}
              />
            </Grid>
            {templateForm.templateId && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Template Variables:
                </Typography>
                {templates
                  .find(t => t.id === templateForm.templateId)
                  ?.variables.map((variable) => (
                    <TextField
                      key={variable}
                      fullWidth
                      label={variable}
                      value={templateForm.variables[variable] || ''}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        variables: { ...templateForm.variables, [variable]: e.target.value }
                      })}
                      sx={{ mb: 1 }}
                    />
                  ))}
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={sendTemplateNotification}
            disabled={!templateForm.templateId || !templateForm.userId}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Notification</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Scheduled Date & Time"
                type="datetime-local"
                value={scheduleForm.scheduledFor}
                onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledFor: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={scheduleNotification}
            disabled={!scheduleForm.scheduledFor}
          >
            Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RealTimeNotificationCenter;
