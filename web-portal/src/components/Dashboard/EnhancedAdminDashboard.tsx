import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Badge,
  Switch,
  FormControlLabel,
  InputAdornment,
  Menu,
  MenuList,
  ListItemButton,
} from '@mui/material';
import {
  Person as UserIcon,
  ShoppingCart as OrderIcon,
  LocalShipping as DeliveryIcon,
  Settings as SettingsIcon,
  Notifications as NotificationIcon,
  Dashboard as DashboardIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  Assessment as AnalyticsIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Store as StoreIcon,
  Timeline as TimelineIcon,
  Group as GroupIcon,
  Star as StarIcon,
  Schedule as ScheduleIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  History as HistoryIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  Monitor as MonitorIcon,
  Database as DatabaseIcon,
  Security as SecurityIcon2,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  databaseConnections: number;
  activeSessions: number;
  uptime: string;
  lastBackup: string;
}

interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  status: 'SUCCESS' | 'FAILED' | 'WARNING';
}

interface SystemAlert {
  id: string;
  type: 'ERROR' | 'WARNING' | 'INFO' | 'SUCCESS';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface EnhancedAdminDashboardProps {
  stats: {
    totalUsers: number;
    totalOrders: number;
    totalDeliveries: number;
    totalRevenue: number;
    activeUsers: number;
    pendingOrders: number;
    completedDeliveries: number;
  };
  onRefresh: () => void;
}

const EnhancedAdminDashboard: React.FC<EnhancedAdminDashboardProps> = ({ stats, onRefresh }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [openNewUser, setOpenNewUser] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'CUSTOMER' as 'BUSINESS' | 'DRIVER' | 'CUSTOMER',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Mock system metrics data
  const systemMetrics: SystemMetrics = {
    cpuUsage: 45.2,
    memoryUsage: 67.8,
    diskUsage: 34.5,
    networkLatency: 12.3,
    databaseConnections: 156,
    activeSessions: 89,
    uptime: '15 days, 8 hours',
    lastBackup: '2024-01-15 02:00:00',
  };

  // Mock user activity data
  const userActivities: UserActivity[] = [
    {
      id: '1',
      userId: 'user-1',
      userName: 'John Smith',
      action: 'LOGIN',
      resource: 'Dashboard',
      timestamp: '2024-01-15 14:30:25',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      status: 'SUCCESS',
    },
    {
      id: '2',
      userId: 'user-2',
      userName: 'Sarah Johnson',
      action: 'CREATE_ORDER',
      resource: 'Order Management',
      timestamp: '2024-01-15 14:28:15',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      status: 'SUCCESS',
    },
    {
      id: '3',
      userId: 'user-3',
      userName: 'Mike Davis',
      action: 'FAILED_LOGIN',
      resource: 'Authentication',
      timestamp: '2024-01-15 14:25:10',
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
      status: 'FAILED',
    },
  ];

  // Mock system alerts data
  const systemAlerts: SystemAlert[] = [
    {
      id: '1',
      type: 'WARNING',
      title: 'High Memory Usage',
      message: 'Memory usage has exceeded 80% for the last 10 minutes',
      timestamp: '2024-01-15 14:20:00',
      resolved: false,
      severity: 'MEDIUM',
    },
    {
      id: '2',
      type: 'ERROR',
      title: 'Database Connection Pool Exhausted',
      message: 'All database connections are currently in use',
      timestamp: '2024-01-15 14:15:00',
      resolved: true,
      severity: 'HIGH',
    },
    {
      id: '3',
      type: 'INFO',
      title: 'Scheduled Backup Completed',
      message: 'Daily backup completed successfully',
      timestamp: '2024-01-15 02:00:00',
      resolved: true,
      severity: 'LOW',
    },
  ];

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'success';
      case 'FAILED': return 'error';
      case 'WARNING': return 'warning';
      default: return 'default';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'ERROR': return 'error';
      case 'WARNING': return 'warning';
      case 'INFO': return 'info';
      case 'SUCCESS': return 'success';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'info';
      default: return 'default';
    }
  };

  const handleCreateUser = async () => {
    setError(null);
    setLoading(true);

    try {
      // Validate form
      if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.phone || !newUser.password) {
        setError('All fields are required');
        return;
      }

      if (newUser.password !== newUser.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (newUser.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      // Call the API to create user
      const response = await authAPI.register({
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,
        password: newUser.password,
        role: newUser.role,
      });

      const data = response;

      if (data.success) {
        setSuccess(`User ${newUser.firstName} ${newUser.lastName} created successfully!`);
        setOpenNewUser(false);
        setNewUser({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          role: 'CUSTOMER',
          password: '',
          confirmPassword: '',
        });
        onRefresh(); // Refresh the dashboard data
      } else {
        setError(data.error?.message || 'Failed to create user');
      }
    } catch (err: any) {
      setError('Failed to create user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Enhanced Admin Dashboard with Tabs */}
      <Paper sx={{ p: 4, mt: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <AdminIcon color="primary" sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h5" component="h2" fontWeight="bold">
            Enhanced Admin Dashboard
          </Typography>
        </Box>

        {/* Dashboard Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Overview" icon={<DashboardIcon />} />
            <Tab label="System Monitoring" icon={<MonitorIcon />} />
            <Tab label="User Management" icon={<UserIcon />} />
            <Tab label="Activity Logs" icon={<HistoryIcon />} />
            <Tab label="System Alerts" icon={<WarningIcon />} />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {activeTab === 0 && (
          <>
            {/* System Overview */}
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
                  System Statistics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ bgcolor: 'primary.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                      <UserIcon color="primary" sx={{ fontSize: 24, mb: 1 }} />
                      <Typography variant="h4" color="primary.main" fontWeight="bold">
                        {stats.totalUsers}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Users
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ bgcolor: 'success.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                      <OrderIcon color="success" sx={{ fontSize: 24, mb: 1 }} />
                      <Typography variant="h4" color="success.main" fontWeight="bold">
                        {stats.totalOrders}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Orders
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ bgcolor: 'info.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                      <DeliveryIcon color="info" sx={{ fontSize: 24, mb: 1 }} />
                      <Typography variant="h4" color="info.main" fontWeight="bold">
                        {stats.totalDeliveries}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Deliveries
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ bgcolor: 'warning.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                      <MoneyIcon color="warning" sx={{ fontSize: 24, mb: 1 }} />
                      <Typography variant="h4" color="warning.main" fontWeight="bold">
                        ${stats.totalRevenue.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Revenue
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
                  System Health
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ bgcolor: 'success.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                      <CheckCircleIcon color="success" sx={{ fontSize: 24, mb: 1 }} />
                      <Typography variant="h4" color="success.main" fontWeight="bold">
                        Online
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        System Status
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ bgcolor: 'info.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                      <NetworkIcon color="info" sx={{ fontSize: 24, mb: 1 }} />
                      <Typography variant="h4" color="info.main" fontWeight="bold">
                        99.9%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Uptime
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ bgcolor: 'warning.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                      <WarningIcon color="warning" sx={{ fontSize: 24, mb: 1 }} />
                      <Typography variant="h4" color="warning.main" fontWeight="bold">
                        {systemAlerts.filter(a => !a.resolved).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active Alerts
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ bgcolor: 'primary.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                      <DatabaseIcon color="primary" sx={{ fontSize: 24, mb: 1 }} />
                      <Typography variant="h4" color="primary.main" fontWeight="bold">
                        {systemMetrics.databaseConnections}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        DB Connections
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            {/* Quick Actions */}
            <Box mt={4}>
              <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<UserIcon />}
                  onClick={() => setOpenNewUser(true)}
                >
                  Create User
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AnalyticsIcon />}
                  onClick={() => navigate('/analytics')}
                >
                  View Analytics
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => navigate('/reports')}
                >
                  Export Reports
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={onRefresh}
                >
                  Refresh Data
                </Button>
              </Box>
            </Box>
          </>
        )}

        {activeTab === 1 && (
          <>
            {/* System Monitoring */}
            <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
              System Performance Metrics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      CPU Usage
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={systemMetrics.cpuUsage} 
                      sx={{ mb: 1 }}
                      color={systemMetrics.cpuUsage > 80 ? 'error' : systemMetrics.cpuUsage > 60 ? 'warning' : 'primary'}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {systemMetrics.cpuUsage}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Memory Usage
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={systemMetrics.memoryUsage} 
                      sx={{ mb: 1 }}
                      color={systemMetrics.memoryUsage > 80 ? 'error' : systemMetrics.memoryUsage > 60 ? 'warning' : 'primary'}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {systemMetrics.memoryUsage}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Disk Usage
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={systemMetrics.diskUsage} 
                      sx={{ mb: 1 }}
                      color={systemMetrics.diskUsage > 80 ? 'error' : systemMetrics.diskUsage > 60 ? 'warning' : 'primary'}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {systemMetrics.diskUsage}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Network Latency
                    </Typography>
                    <Box display="flex" alignItems="center">
                      <NetworkIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h4" color="primary.main">
                        {systemMetrics.networkLatency}ms
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={3} mt={2}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      System Uptime
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {systemMetrics.uptime}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Active Sessions
                    </Typography>
                    <Typography variant="h4" color="info.main">
                      {systemMetrics.activeSessions}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Last Backup
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {systemMetrics.lastBackup}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}

        {activeTab === 2 && (
          <>
            {/* User Management */}
            <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
              User Management
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<UserIcon />}
                onClick={() => setOpenNewUser(true)}
              >
                Create New User
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => navigate('/users/export')}
              >
                Export Users
              </Button>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => navigate('/users/import')}
              >
                Import Users
              </Button>
            </Box>

            {/* User Statistics */}
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} sm={3}>
                <Box sx={{ bgcolor: 'primary.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {stats.totalUsers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ bgcolor: 'success.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {stats.activeUsers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Users
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ bgcolor: 'info.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    {Math.floor(stats.totalUsers * 0.3)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    New This Month
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ bgcolor: 'warning.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main" fontWeight="bold">
                    {Math.floor(stats.totalUsers * 0.05)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Verification
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </>
        )}

        {activeTab === 3 && (
          <>
            {/* Activity Logs */}
            <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
              Recent User Activity
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Resource</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            {activity.userName.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {activity.userName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {activity.action.replace('_', ' ')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {activity.resource}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={activity.status}
                          color={getStatusColor(activity.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {activity.ipAddress}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {activity.timestamp}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {activeTab === 4 && (
          <>
            {/* System Alerts */}
            <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
              System Alerts & Notifications
            </Typography>
            <Grid container spacing={2}>
              {systemAlerts.map((alert) => (
                <Grid item xs={12} md={6} key={alert.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Box display="flex" alignItems="center" flexGrow={1}>
                          {alert.type === 'ERROR' && <ErrorIcon color="error" sx={{ mr: 1 }} />}
                          {alert.type === 'WARNING' && <WarningIcon color="warning" sx={{ mr: 1 }} />}
                          {alert.type === 'INFO' && <InfoIcon color="info" sx={{ mr: 1 }} />}
                          {alert.type === 'SUCCESS' && <CheckCircleIcon color="success" sx={{ mr: 1 }} />}
                          <Typography variant="h6" fontWeight="medium">
                            {alert.title}
                          </Typography>
                        </Box>
                        <Chip
                          label={alert.severity}
                          color={getSeverityColor(alert.severity) as any}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        {alert.message}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          {alert.timestamp}
                        </Typography>
                        <Chip
                          label={alert.resolved ? 'Resolved' : 'Active'}
                          color={alert.resolved ? 'success' : 'warning'}
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Paper>

      {/* Error and Success Messages */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Create User Dialog */}
      <Dialog open={openNewUser} onClose={() => setOpenNewUser(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="First Name"
              value={newUser.firstName}
              onChange={(e) => setNewUser(prev => ({ ...prev, firstName: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Last Name"
              value={newUser.lastName}
              onChange={(e) => setNewUser(prev => ({ ...prev, lastName: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Phone Number"
              type="tel"
              value={newUser.phone}
              onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
              fullWidth
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Role</InputLabel>
              <Select
                value={newUser.role}
                label="Role"
                onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as 'BUSINESS' | 'DRIVER' | 'CUSTOMER' }))}
              >
                <MenuItem value="CUSTOMER">Customer</MenuItem>
                <MenuItem value="DRIVER">Driver</MenuItem>
                <MenuItem value="BUSINESS">Business</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Password"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Confirm Password"
              type="password"
              value={newUser.confirmPassword}
              onChange={(e) => setNewUser(prev => ({ ...prev, confirmPassword: e.target.value }))}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewUser(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateUser} 
            variant="contained" 
            disabled={loading || !newUser.firstName || !newUser.lastName || !newUser.email || !newUser.phone || !newUser.password}
          >
            {loading ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EnhancedAdminDashboard;
