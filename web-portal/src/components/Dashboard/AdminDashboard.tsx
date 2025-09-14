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
  Storage as DatabaseIcon,
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

interface AdminDashboardProps {
  stats: {
    totalUsers: number;
    totalOrders: number;
    totalDeliveries: number;
    totalRevenue: number;
    activeUsers: number;
    pendingOrders: number;
    completedDeliveries: number;
    totalBusiness: number;
  };
  onRefresh: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ stats, onRefresh }) => {
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
        setSuccess(`User created successfully! Email: ${newUser.email}, Role: ${newUser.role}`);
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
        setError(data.message || 'Failed to create user');
      }
    } catch (err: any) {
      setError('Failed to create user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* System Analytics */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          System Analytics
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  System Health
                </Typography>
                <Typography variant="h4" color="success.main">
                  98%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All systems operational
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Users
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {stats.activeUsers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Currently online
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  API Response Time
                </Typography>
                <Typography variant="h4" color="info.main">
                  45ms
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average response time
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Database Status
                </Typography>
                <Typography variant="h4" color="success.main">
                  Healthy
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All connections stable
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Business Insights */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Business Insights
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Revenue Trends
                </Typography>
                <Typography variant="h4" color="success.main">
                  ${stats.totalRevenue.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total revenue (+15% vs last month)
                </Typography>
                <Box mt={2}>
                  <LinearProgress variant="determinate" value={75} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Customer Satisfaction
                </Typography>
                <Typography variant="h4" color="success.main">
                  4.8/5.0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Based on 1,247 reviews
                </Typography>
                <Box mt={2}>
                  <LinearProgress variant="determinate" value={96} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Driver Performance
                </Typography>
                <Typography variant="h4" color="primary.main">
                  92%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  On-time delivery rate
                </Typography>
                <Box mt={2}>
                  <LinearProgress variant="determinate" value={92} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Comprehensive Business Overview */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <BusinessIcon color="primary" sx={{ mr: 2, fontSize: 28 }} />
          <Typography variant="h5" component="h2" fontWeight="bold">
            Business Overview
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          {/* Financial Metrics */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
              Financial Performance
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: 'success.50', p: 2, borderRadius: 2, textAlign: 'center' }}>
                  <MoneyIcon color="success" sx={{ fontSize: 24, mb: 1 }} />
                  <Typography variant="h5" color="success.main" fontWeight="bold">
                    ${stats.totalRevenue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: 'info.50', p: 2, borderRadius: 2, textAlign: 'center' }}>
                  <TrendingUpIcon color="info" sx={{ fontSize: 24, mb: 1 }} />
                  <Typography variant="h5" color="info.main" fontWeight="bold">
                    +15.2%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Growth Rate
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: 'warning.50', p: 2, borderRadius: 2, textAlign: 'center' }}>
                  <AnalyticsIcon color="warning" sx={{ fontSize: 24, mb: 1 }} />
                  <Typography variant="h5" color="warning.main" fontWeight="bold">
                    $2,847
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Order Value
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: 'error.50', p: 2, borderRadius: 2, textAlign: 'center' }}>
                  <TimelineIcon color="error" sx={{ fontSize: 24, mb: 1 }} />
                  <Typography variant="h5" color="error.main" fontWeight="bold">
                    4.7x
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ROI Multiplier
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>

          {/* Operational Metrics */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
              Operational Excellence
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: 'primary.50', p: 2, borderRadius: 2, textAlign: 'center' }}>
                  <SpeedIcon color="primary" sx={{ fontSize: 24, mb: 1 }} />
                  <Typography variant="h5" color="primary.main" fontWeight="bold">
                    24 min
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Delivery Time
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: 'secondary.50', p: 2, borderRadius: 2, textAlign: 'center' }}>
                  <StarIcon color="secondary" sx={{ fontSize: 24, mb: 1 }} />
                  <Typography variant="h5" color="secondary.main" fontWeight="bold">
                    4.8/5
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Customer Rating
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: 'success.50', p: 2, borderRadius: 2, textAlign: 'center' }}>
                  <ScheduleIcon color="success" sx={{ fontSize: 24, mb: 1 }} />
                  <Typography variant="h5" color="success.main" fontWeight="bold">
                    96.5%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    On-Time Rate
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: 'info.50', p: 2, borderRadius: 2, textAlign: 'center' }}>
                  <SecurityIcon color="info" sx={{ fontSize: 24, mb: 1 }} />
                  <Typography variant="h5" color="info.main" fontWeight="bold">
                    99.9%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Uptime
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Business Growth & Market Insights */}
        <Box mt={4} pt={3} borderTop="1px solid" borderColor="divider">
          <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
            Market Position & Growth
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ bgcolor: 'grey.50', p: 3, borderRadius: 2 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <StoreIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="subtitle1" fontWeight="medium">
                    Market Share
                  </Typography>
                </Box>
                <Typography variant="h4" color="primary.main" fontWeight="bold">
                  12.4%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Local delivery market
                </Typography>
                <Box mt={1}>
                  <LinearProgress variant="determinate" value={62} color="primary" />
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ bgcolor: 'grey.50', p: 3, borderRadius: 2 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <GroupIcon color="success" sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="subtitle1" fontWeight="medium">
                    Customer Retention
                  </Typography>
                </Box>
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  87.3%
                  </Typography>
                <Typography variant="body2" color="text.secondary">
                  Monthly retention rate
                </Typography>
                <Box mt={1}>
                  <LinearProgress variant="determinate" value={87} color="success" />
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ bgcolor: 'grey.50', p: 3, borderRadius: 2 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <TrendingUpIcon color="info" sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="subtitle1" fontWeight="medium">
                    Growth Trajectory
                  </Typography>
                </Box>
                <Typography variant="h4" color="info.main" fontWeight="bold">
                  +23.1%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Year-over-year growth
                </Typography>
                <Box mt={1}>
                  <LinearProgress variant="determinate" value={77} color="info" />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* User Management Overview */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            User Management Overview
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/users')}>
            Manage Users
          </Button>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Users
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {stats.totalUsers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Registered accounts
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Users
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.activeUsers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Currently online
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  New This Week
                </Typography>
                <Typography variant="h4" color="info.main">
                  23
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Recent registrations
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending Approval
                </Typography>
                <Typography variant="h4" color="warning.main">
                  5
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Driver applications
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* System Monitoring */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          System Monitoring
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Server Resources
                </Typography>
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">CPU Usage</Typography>
                    <Typography variant="body2">45%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={45} />
                </Box>
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Memory Usage</Typography>
                    <Typography variant="body2">62%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={62} />
                </Box>
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Disk Usage</Typography>
                    <Typography variant="body2">28%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={28} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Database Performance
                </Typography>
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Query Response</Typography>
                    <Typography variant="body2">12ms</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={88} />
                </Box>
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Connections</Typography>
                    <Typography variant="body2">24/50</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={48} />
                </Box>
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Cache Hit Rate</Typography>
                    <Typography variant="body2">94%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={94} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>



      {/* System Alerts */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          System Alerts & Notifications
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <NotificationIcon color="info" />
            </ListItemIcon>
            <ListItemText
              primary="System Update Available"
              secondary="New version v2.1.0 is ready for deployment"
            />
            <Chip label="Info" color="info" size="small" />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemIcon>
                                  <NotificationIcon color="warning" />
            </ListItemIcon>
            <ListItemText
              primary="Security Scan Complete"
              secondary="No vulnerabilities detected in latest scan"
            />
            <Chip label="Security" color="success" size="small" />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemIcon>
              <TrendingUpIcon color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Performance Optimization"
              secondary="Database queries optimized, 15% improvement in response time"
            />
            <Chip label="Performance" color="success" size="small" />
          </ListItem>
                  </List>
        </Paper>

        {/* New User Dialog */}
        <Dialog open={openNewUser} onClose={() => setOpenNewUser(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New User</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                {success}
              </Alert>
            )}
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
                placeholder="+1 (555) 123-4567"
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
                helperText="Password must be at least 6 characters long"
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
              disabled={loading || !newUser.firstName || !newUser.lastName || !newUser.email || !newUser.phone || !newUser.password || newUser.password !== newUser.confirmPassword}
            >
              {loading ? <CircularProgress size={24} /> : 'Create User'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Business Account Creation Section */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" component="h2">
              Business Account Management
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create and manage business accounts for your partners and clients. Business accounts have access to the Business Dashboard.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<BusinessIcon />}
              onClick={() => {
                setNewUser({
                  firstName: '',
                  lastName: '',
                  email: '',
                  phone: '',
                  role: 'BUSINESS',
                  password: '',
                  confirmPassword: ''
                });
                setOpenNewUser(true);
              }}
            >
              Create Business Account
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => navigate('/business')}
              startIcon={<BusinessIcon />}
            >
              View Business Dashboard
            </Button>
          </Box>

          {stats.totalBusiness > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              You currently have {stats.totalBusiness} business account(s) in your system.
            </Alert>
          )}
        </Paper>
      </>
    );
  };

export default AdminDashboard;
