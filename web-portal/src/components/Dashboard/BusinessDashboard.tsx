import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
} from '@mui/material';
import {
  PersonAdd as AddDriverIcon,
  LocalShipping as DeliveryIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Star as StarIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Assessment as AnalyticsIcon,
  Speed as SpeedIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Timeline as TimelineIcon,
  AttachMoney as MoneyIcon,
  AccountBalance as BankIcon,
  Receipt as ReceiptIcon,
  TrendingDown as TrendingDownIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  CalendarToday as CalendarIcon,
  Map as MapIcon,
  Route as RouteIcon,
  Navigation as NavigationIcon,
  MyLocation as MyLocationIcon,
  Directions as DirectionsIcon,
  Traffic as TrafficIcon,
  Schedule as ScheduleIcon,
  GpsFixed as GpsFixedIcon,
  ShoppingCart as OrdersIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../../services/api';

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isAvailable: boolean;
  vehicleType: string;
  vehicleModel: string;
  rating: number;
  totalDeliveries: number;
  joinedDate: string;
  // Performance metrics
  averageDeliveryTime: number; // in minutes
  onTimeDeliveryRate: number; // percentage
  customerSatisfaction: number; // rating
  totalEarnings: number;
  lastActive: string;
  currentLocation?: {
    lat: number;
    lng: number;
  };
}

interface FinancialData {
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  averageOrderValue: number;
  revenueGrowth: number;
  expenseBreakdown: {
    fuel: number;
    maintenance: number;
    insurance: number;
    driverPay: number;
    other: number;
  };
  paymentMethods: {
    cash: number;
    card: number;
    digital: number;
  };
}

interface RevenueTrend {
  date: string;
  revenue: number;
  deliveries: number;
}

interface DeliveryRoute {
  id: string;
  driverId: string;
  driverName: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  startLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  endLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  waypoints: Array<{
    lat: number;
    lng: number;
    address: string;
    orderId: string;
    status: 'PENDING' | 'PICKED_UP' | 'DELIVERED';
  }>;
  estimatedDuration: number; // in minutes
  actualDuration?: number; // in minutes
  distance: number; // in miles
  fuelCost: number;
  efficiency: number; // percentage
  startTime: string;
  endTime?: string;
  trafficConditions: 'LIGHT' | 'MODERATE' | 'HEAVY';
}

interface RouteOptimization {
  totalRoutes: number;
  optimizedRoutes: number;
  averageEfficiency: number;
  totalDistance: number;
  totalFuelCost: number;
  timeSaved: number; // in minutes
  costSavings: number;
}

interface BusinessDashboardProps {
  stats: {
    totalDrivers: number;
    totalDeliveries: number;
    totalRevenue: number;
    averageRating: number;
  };
  onRefresh: () => void;
}

const BusinessDashboard: React.FC<BusinessDashboardProps> = ({ stats, onRefresh }) => {
  const navigate = useNavigate();
  const [openAddDriver, setOpenAddDriver] = useState(false);
  const [openEditDriver, setOpenEditDriver] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{id: string, name: string, role: string} | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  
  // Provide default stats if none are provided
  const defaultStats = {
    totalDrivers: 0,
    totalDeliveries: 0,
    totalRevenue: 0,
    averageRating: 0,
  };
  
  const safeStats = stats || defaultStats;

  const [newDriver, setNewDriver] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    vehicleType: '',
    vehicleModel: '',
  });
  const [editDriver, setEditDriver] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    vehicleType: '',
    vehicleModel: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Mock data - in a real app, this would come from API
  const [drivers, setDrivers] = useState<Driver[]>([
    {
      id: '1',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      phone: '+1 (555) 123-4567',
      isAvailable: true,
      vehicleType: 'Car',
      vehicleModel: 'Toyota Camry',
      rating: 4.8,
      totalDeliveries: 156,
      joinedDate: '2024-01-15',
      averageDeliveryTime: 28.5,
      onTimeDeliveryRate: 94.2,
      customerSatisfaction: 4.8,
      totalEarnings: 2847.50,
      lastActive: '2024-01-15 14:30',
      currentLocation: { lat: 40.7128, lng: -74.0060 },
    },
    {
      id: '2',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+1 (555) 234-5678',
      isAvailable: false,
      vehicleType: 'Van',
      vehicleModel: 'Ford Transit',
      rating: 4.9,
      totalDeliveries: 203,
      joinedDate: '2023-11-20',
      averageDeliveryTime: 32.1,
      onTimeDeliveryRate: 96.8,
      customerSatisfaction: 4.9,
      totalEarnings: 3201.75,
      lastActive: '2024-01-15 12:15',
      currentLocation: { lat: 40.7589, lng: -73.9851 },
    },
    {
      id: '3',
      firstName: 'Mike',
      lastName: 'Davis',
      email: 'mike.davis@example.com',
      phone: '+1 (555) 345-6789',
      isAvailable: true,
      vehicleType: 'Motorcycle',
      vehicleModel: 'Honda CB500X',
      rating: 4.6,
      totalDeliveries: 89,
      joinedDate: '2024-03-10',
      averageDeliveryTime: 25.3,
      onTimeDeliveryRate: 91.5,
      customerSatisfaction: 4.6,
      totalEarnings: 1654.20,
      lastActive: '2024-01-15 15:45',
      currentLocation: { lat: 40.7505, lng: -73.9934 },
    },
  ]);

  // Mock financial data - in a real app, this would come from API
  const financialData: FinancialData = {
    dailyRevenue: 2847.50,
    weeklyRevenue: 19832.75,
    monthlyRevenue: 75640.20,
    yearlyRevenue: 456780.50,
    totalExpenses: 52340.30,
    netProfit: 23299.90,
    profitMargin: 30.8,
    averageOrderValue: 45.80,
    revenueGrowth: 12.5,
    expenseBreakdown: {
      fuel: 1250.00,
      maintenance: 850.00,
      insurance: 1200.00,
      driverPay: 4500.00,
      other: 400.00,
    },
    paymentMethods: {
      cash: 35,
      card: 45,
      digital: 20,
    },
  };

  // Mock revenue trend data
  const revenueTrend: RevenueTrend[] = [
    { date: '2024-01-08', revenue: 2450, deliveries: 52 },
    { date: '2024-01-09', revenue: 2680, deliveries: 58 },
    { date: '2024-01-10', revenue: 2320, deliveries: 48 },
    { date: '2024-01-11', revenue: 2890, deliveries: 62 },
    { date: '2024-01-12', revenue: 3150, deliveries: 68 },
    { date: '2024-01-13', revenue: 2980, deliveries: 64 },
    { date: '2024-01-14', revenue: 2847, deliveries: 61 },
  ];

  // Mock delivery routes data
  const deliveryRoutes: DeliveryRoute[] = [
    {
      id: '1',
      driverId: '1',
      driverName: 'John Smith',
      status: 'IN_PROGRESS',
      startLocation: { lat: 40.7128, lng: -74.0060, address: '123 Business Ave, New York, NY' },
      endLocation: { lat: 40.7589, lng: -73.9851, address: '456 Commerce St, New York, NY' },
      waypoints: [
        { lat: 40.7505, lng: -73.9934, address: '789 Main St, New York, NY', orderId: 'ORD-001', status: 'PICKED_UP' },
        { lat: 40.7614, lng: -73.9776, address: '321 Park Ave, New York, NY', orderId: 'ORD-002', status: 'PENDING' },
        { lat: 40.7505, lng: -73.9934, address: '654 Broadway, New York, NY', orderId: 'ORD-003', status: 'PENDING' },
      ],
      estimatedDuration: 45,
      actualDuration: 38,
      distance: 12.5,
      fuelCost: 8.50,
      efficiency: 92.3,
      startTime: '2024-01-15 09:00',
      trafficConditions: 'MODERATE',
    },
    {
      id: '2',
      driverId: '2',
      driverName: 'Sarah Johnson',
      status: 'COMPLETED',
      startLocation: { lat: 40.7128, lng: -74.0060, address: '123 Business Ave, New York, NY' },
      endLocation: { lat: 40.7589, lng: -73.9851, address: '456 Commerce St, New York, NY' },
      waypoints: [
        { lat: 40.7505, lng: -73.9934, address: '987 5th Ave, New York, NY', orderId: 'ORD-004', status: 'DELIVERED' },
        { lat: 40.7614, lng: -73.9776, address: '147 Madison Ave, New York, NY', orderId: 'ORD-005', status: 'DELIVERED' },
      ],
      estimatedDuration: 35,
      actualDuration: 32,
      distance: 8.2,
      fuelCost: 5.60,
      efficiency: 96.8,
      startTime: '2024-01-15 08:30',
      endTime: '2024-01-15 09:02',
      trafficConditions: 'LIGHT',
    },
    {
      id: '3',
      driverId: '3',
      driverName: 'Mike Davis',
      status: 'DELAYED',
      startLocation: { lat: 40.7128, lng: -74.0060, address: '123 Business Ave, New York, NY' },
      endLocation: { lat: 40.7589, lng: -73.9851, address: '456 Commerce St, New York, NY' },
      waypoints: [
        { lat: 40.7505, lng: -73.9934, address: '258 Wall St, New York, NY', orderId: 'ORD-006', status: 'PENDING' },
        { lat: 40.7614, lng: -73.9776, address: '369 Water St, New York, NY', orderId: 'ORD-007', status: 'PENDING' },
      ],
      estimatedDuration: 40,
      distance: 15.8,
      fuelCost: 10.20,
      efficiency: 78.5,
      startTime: '2024-01-15 10:15',
      trafficConditions: 'HEAVY',
    },
  ];

  // Mock route optimization data
  const routeOptimization: RouteOptimization = {
    totalRoutes: 15,
    optimizedRoutes: 12,
    averageEfficiency: 89.2,
    totalDistance: 156.8,
    totalFuelCost: 125.50,
    timeSaved: 45,
    costSavings: 28.75,
  };

  const handleAddDriver = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await usersAPI.registerDriver(newDriver);
      
      if (response.success) {
        const newDriverData: Driver = {
          id: response.data.driver.id,
          firstName: response.data.driver.firstName,
          lastName: response.data.driver.lastName,
          email: response.data.driver.email,
          phone: response.data.driver.phone,
          isAvailable: true,
          vehicleType: newDriver.vehicleType,
          vehicleModel: newDriver.vehicleModel,
          rating: 0,
          totalDeliveries: 0,
          joinedDate: new Date(response.data.driver.createdAt).toISOString().split('T')[0],
          averageDeliveryTime: 0,
          onTimeDeliveryRate: 0,
          customerSatisfaction: 0,
          totalEarnings: 0,
          lastActive: new Date().toISOString(),
        };

        setDrivers(prev => [...prev, newDriverData]);
        setSuccess(`Driver added successfully! Temporary password: ${response.data.tempPassword}`);
        setOpenAddDriver(false);
        setNewDriver({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          vehicleType: '',
          vehicleModel: '',
        });
      } else {
        setError('Failed to add driver');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to add driver. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDriver = async () => {
    if (!selectedDriver) return;
    
    setError(null);
    setLoading(true);

    try {
      // In a real app, this would call an API endpoint to update the driver
      // For now, we'll simulate the update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setDrivers(prev => prev.map(driver => 
        driver.id === selectedDriver.id 
          ? { 
              ...driver, 
              firstName: editDriver.firstName,
              lastName: editDriver.lastName,
              email: editDriver.email,
              phone: editDriver.phone,
              vehicleType: editDriver.vehicleType,
              vehicleModel: editDriver.vehicleModel,
            }
          : driver
      ));
      
      setSuccess(`Driver ${editDriver.firstName} ${editDriver.lastName} updated successfully!`);
      setOpenEditDriver(false);
      setSelectedDriver(null);
      setEditDriver({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        vehicleType: '',
        vehicleModel: '',
      });
    } catch (err: any) {
      setError('Failed to update driver. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDriver = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    if (driver) {
      setSelectedDriver(driver);
      setOpenDeleteDialog(true);
    }
  };

  const confirmDeleteDriver = async () => {
    if (!selectedDriver) return;
    
    setError(null);
    setLoading(true);

    try {
      // In a real app, this would call an API endpoint to delete the driver
      // For now, we'll simulate the deletion
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setDrivers(prev => prev.filter(driver => driver.id !== selectedDriver.id));
      setSuccess(`Driver ${selectedDriver.firstName} ${selectedDriver.lastName} deleted successfully!`);
      setOpenDeleteDialog(false);
      setSelectedDriver(null);
    } catch (err: any) {
      setError('Failed to delete driver. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openEditDriverDialog = (driver: Driver) => {
    setSelectedDriver(driver);
    setEditDriver({
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email,
      phone: driver.phone,
      vehicleType: driver.vehicleType,
      vehicleModel: driver.vehicleModel,
    });
    setOpenEditDriver(true);
  };

  const handleResetAccount = async () => {
    if (!selectedUser) return;
    
    setError(null);
    setLoading(true);

    try {
      // In a real app, this would call an API endpoint to reset the account
      // For now, we'll simulate the reset
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(`Account reset successful! New temporary password for ${selectedUser.name} (${selectedUser.role}): TempPass123!`);
      setOpenResetDialog(false);
      setSelectedUser(null);
    } catch (err: any) {
      setError('Failed to reset account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openResetAccountDialog = (userId: string, userName: string, userRole: string) => {
    setSelectedUser({ id: userId, name: userName, role: userRole });
    setOpenResetDialog(true);
  };

  // Helper functions for route optimization
  const getRouteStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'info';
      case 'IN_PROGRESS': return 'primary';
      case 'COMPLETED': return 'success';
      case 'DELAYED': return 'error';
      default: return 'default';
    }
  };

  const getTrafficColor = (traffic: string) => {
    switch (traffic) {
      case 'LIGHT': return 'success';
      case 'MODERATE': return 'warning';
      case 'HEAVY': return 'error';
      default: return 'default';
    }
  };

  const getWaypointStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'PICKED_UP': return 'info';
      case 'DELIVERED': return 'success';
      default: return 'default';
    }
  };

  return (
    <>
      {/* Header Section */}
      <Paper sx={{ p: 4, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center">
            <BusinessIcon sx={{ mr: 2, fontSize: 40 }} />
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold">
                Business Dashboard
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Manage your delivery operations
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
            }}
          >
            Refresh Data
          </Button>
        </Box>
      </Paper>

      {/* Quick Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            p: 3, 
            textAlign: 'center', 
            background: 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)',
            color: 'white',
            height: '100%'
          }}>
            <PeopleIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h3" fontWeight="bold">
              {safeStats.totalDrivers}
            </Typography>
            <Typography variant="h6">Total Drivers</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {drivers.filter(d => d.isAvailable).length} available now
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            p: 3, 
            textAlign: 'center', 
            background: 'linear-gradient(45deg, #2196F3 30%, #42A5F5 90%)',
            color: 'white',
            height: '100%'
          }}>
            <DeliveryIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h3" fontWeight="bold">
              {safeStats.totalDeliveries}
            </Typography>
            <Typography variant="h6">Total Deliveries</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              All time deliveries
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            p: 3, 
            textAlign: 'center', 
            background: 'linear-gradient(45deg, #FF9800 30%, #FFB74D 90%)',
            color: 'white',
            height: '100%'
          }}>
            <MoneyIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h3" fontWeight="bold">
              ${safeStats.totalRevenue.toLocaleString()}
            </Typography>
            <Typography variant="h6">Total Revenue</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Lifetime earnings
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            p: 3, 
            textAlign: 'center', 
            background: 'linear-gradient(45deg, #9C27B0 30%, #BA68C8 90%)',
            color: 'white',
            height: '100%'
          }}>
            <StarIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h3" fontWeight="bold">
              {safeStats.averageRating.toFixed(1)}
            </Typography>
            <Typography variant="h6">Avg Rating</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Customer satisfaction
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions Section */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <SettingsIcon color="primary" sx={{ mr: 2, fontSize: 28 }} />
          <Typography variant="h5" component="h2" fontWeight="bold">
            Quick Actions
          </Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<OrdersIcon />}
              onClick={() => navigate('/orders/create')}
              fullWidth
              sx={{ 
                py: 2,
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                }
              }}
            >
              Create New Order
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              startIcon={<PeopleIcon />}
              onClick={() => navigate('/drivers')}
              fullWidth
              sx={{ py: 2 }}
            >
              Manage Drivers
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              startIcon={<RouteIcon />}
              onClick={() => navigate('/route-optimization')}
              fullWidth
              sx={{ py: 2 }}
            >
              Optimize Routes
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              startIcon={<MapIcon />}
              onClick={() => navigate('/live-tracking')}
              fullWidth
              sx={{ py: 2 }}
            >
              Live Tracking
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Business Overview - Single Card */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <BusinessIcon color="primary" sx={{ mr: 2, fontSize: 28 }} />
          <Typography variant="h5" component="h2" fontWeight="bold">
            Business Information
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Business Info Section */}
          <Grid item xs={12} md={6}>
            <Box mb={3}>
              <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
                Business Information
              </Typography>
              <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <BusinessIcon sx={{ mr: 1, fontSize: 20, color: 'primary.main' }} />
                  <Typography variant="subtitle1" fontWeight="medium">
                    Delivery Express Inc.
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={1}>
                  <LocationIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    123 Business Ave, City, State 12345
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={1}>
                  <PhoneIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    +1 (555) 123-4567
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <EmailIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    business@deliveryexpress.com
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Drivers Section */}
            <Box mb={3}>
              <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
                Drivers
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ bgcolor: 'primary.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                    <PeopleIcon color="primary" sx={{ fontSize: 24, mb: 1 }} />
                    <Typography variant="h4" color="primary.main" fontWeight="bold">
                      {safeStats.totalDrivers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Drivers
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ bgcolor: 'success.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                    <DeliveryIcon color="success" sx={{ fontSize: 24, mb: 1 }} />
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      {drivers.filter(d => d.isAvailable).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Available Now
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Deliveries & Customers Section */}
          <Grid item xs={12} md={6}>
            {/* Deliveries Section */}
            <Box mb={3}>
              <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
                Deliveries
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ bgcolor: 'info.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                    <TrendingUpIcon color="info" sx={{ fontSize: 24, mb: 1 }} />
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      {safeStats.totalDeliveries}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Deliveries
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ bgcolor: 'warning.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                    <StarIcon color="warning" sx={{ fontSize: 24, mb: 1 }} />
                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                      {safeStats.averageRating.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Rating
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Customers Section */}
            <Box mb={3}>
              <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
                Customers
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ bgcolor: 'secondary.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                    <PeopleIcon color="secondary" sx={{ fontSize: 24, mb: 1 }} />
                    <Typography variant="h4" color="secondary.main" fontWeight="bold">
                      {Math.floor(safeStats.totalDeliveries * 0.8)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Customers
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ bgcolor: 'error.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                    <TrendingUpIcon color="error" sx={{ fontSize: 24, mb: 1 }} />
                    <Typography variant="h4" color="error.main" fontWeight="bold">
                      ${safeStats.totalRevenue.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Revenue
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>

      </Paper>

      {/* Driver Performance Analytics */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center">
            <AnalyticsIcon color="primary" sx={{ mr: 2, fontSize: 28 }} />
            <Typography variant="h5" component="h2" fontWeight="bold">
              Driver Performance
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<PeopleIcon />}
            onClick={() => navigate('/drivers')}
            size="small"
          >
            View All Drivers
          </Button>
        </Box>

        <Grid container spacing={4}>
          {/* Performance Overview */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
              Performance Overview
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: 'success.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                  <CheckIcon color="success" sx={{ fontSize: 24, mb: 1 }} />
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {drivers.length > 0 ? (drivers.reduce((sum, driver) => sum + driver.onTimeDeliveryRate, 0) / drivers.length).toFixed(1) : 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg On-Time Rate
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: 'info.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                  <TimeIcon color="info" sx={{ fontSize: 24, mb: 1 }} />
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    {drivers.length > 0 ? (drivers.reduce((sum, driver) => sum + driver.averageDeliveryTime, 0) / drivers.length).toFixed(1) : 0}m
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Delivery Time
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>

          {/* Top Performers */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
              Top Performers
            </Typography>
            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
              {drivers
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 3)
                .map((driver, index) => (
                  <Box key={driver.id} display="flex" alignItems="center" mb={1}>
                    <Avatar sx={{ mr: 2, bgcolor: index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze', width: 32, height: 32 }}>
                      {index + 1}
                    </Avatar>
                    <Box flexGrow={1}>
                      <Typography variant="subtitle2" fontWeight="medium">
                        {driver.firstName} {driver.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {driver.rating.toFixed(1)} ⭐ • {driver.totalDeliveries} deliveries
                      </Typography>
                    </Box>
                  </Box>
                ))}
            </Box>
          </Grid>
        </Grid>

        {/* Driver Performance Table */}
        <Box mt={4}>
          <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
            Driver Performance Details
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Driver</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Deliveries</TableCell>
                  <TableCell>Avg Time</TableCell>
                  <TableCell>On-Time Rate</TableCell>
                  <TableCell>Earnings</TableCell>
                  <TableCell>Last Active</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {drivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {driver.firstName[0]}{driver.lastName[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {driver.firstName} {driver.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {driver.vehicleType} • {driver.vehicleModel}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={driver.isAvailable ? 'Available' : 'Offline'}
                        color={driver.isAvailable ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <StarIcon sx={{ fontSize: 16, color: 'warning.main', mr: 0.5 }} />
                        <Typography variant="body2" fontWeight="medium">
                          {driver.rating.toFixed(1)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {driver.totalDeliveries}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <TimeIcon sx={{ fontSize: 16, color: 'info.main', mr: 0.5 }} />
                        <Typography variant="body2" fontWeight="medium">
                          {driver.averageDeliveryTime}m
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <CheckIcon sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                        <Typography variant="body2" fontWeight="medium">
                          {driver.onTimeDeliveryRate}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        ${driver.totalEarnings.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {driver.lastActive}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => navigate(`/drivers/${driver.id}`)}>
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Driver">
                          <IconButton size="small" onClick={() => openEditDriverDialog(driver)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reset Password">
                          <IconButton 
                            size="small" 
                            onClick={() => openResetAccountDialog(driver.id, `${driver.firstName} ${driver.lastName}`, 'DRIVER')}
                          >
                            <SecurityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Driver">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteDriver(driver.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>

      {/* Financial Reporting & Analytics */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center">
            <MoneyIcon color="primary" sx={{ mr: 2, fontSize: 28 }} />
            <Typography variant="h5" component="h2" fontWeight="bold">
              Financial Overview
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<AnalyticsIcon />}
            onClick={() => navigate('/analytics')}
            size="small"
          >
            View Analytics
          </Button>
        </Box>

        <Grid container spacing={4}>
          {/* Revenue Overview */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
              Revenue Overview
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: 'success.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                  <MoneyIcon color="success" sx={{ fontSize: 24, mb: 1 }} />
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    ${financialData.dailyRevenue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Today's Revenue
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: 'primary.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                  <TrendingUpIcon color="primary" sx={{ fontSize: 24, mb: 1 }} />
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    ${financialData.weeklyRevenue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This Week
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: 'info.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                  <CalendarIcon color="info" sx={{ fontSize: 24, mb: 1 }} />
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    ${financialData.monthlyRevenue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This Month
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: 'warning.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                  <BankIcon color="warning" sx={{ fontSize: 24, mb: 1 }} />
                  <Typography variant="h4" color="warning.main" fontWeight="bold">
                    ${financialData.yearlyRevenue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This Year
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>

          {/* Profit & Growth */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
              Profit & Growth
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: 'success.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                  <TrendingUpIcon color="success" sx={{ fontSize: 24, mb: 1 }} />
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    ${financialData.netProfit.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Net Profit
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: 'secondary.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                  <PieChartIcon color="secondary" sx={{ fontSize: 24, mb: 1 }} />
                  <Typography variant="h4" color="secondary.main" fontWeight="bold">
                    {financialData.profitMargin}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Profit Margin
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: 'error.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                  <TrendingDownIcon color="error" sx={{ fontSize: 24, mb: 1 }} />
                  <Typography variant="h4" color="error.main" fontWeight="bold">
                    ${financialData.totalExpenses.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Expenses
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: 'info.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                  <BarChartIcon color="info" sx={{ fontSize: 24, mb: 1 }} />
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    +{financialData.revenueGrowth}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Revenue Growth
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Expense Breakdown */}
        <Box mt={4}>
          <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
            Expense Breakdown
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Box sx={{ bgcolor: 'error.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                <Typography variant="h6" color="error.main" fontWeight="bold">
                  ${financialData.expenseBreakdown.fuel.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Fuel
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Box sx={{ bgcolor: 'warning.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                <Typography variant="h6" color="warning.main" fontWeight="bold">
                  ${financialData.expenseBreakdown.maintenance.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Maintenance
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Box sx={{ bgcolor: 'info.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                <Typography variant="h6" color="info.main" fontWeight="bold">
                  ${financialData.expenseBreakdown.insurance.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Insurance
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Box sx={{ bgcolor: 'primary.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                <Typography variant="h6" color="primary.main" fontWeight="bold">
                  ${financialData.expenseBreakdown.driverPay.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Driver Pay
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Box sx={{ bgcolor: 'secondary.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                <Typography variant="h6" color="secondary.main" fontWeight="bold">
                  ${financialData.expenseBreakdown.other.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Other
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Payment Methods & Average Order Value */}
        <Grid container spacing={4} mt={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
              Payment Methods Distribution
            </Typography>
            <Box sx={{ bgcolor: 'grey.50', p: 3, borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      {financialData.paymentMethods.cash}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cash
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary.main" fontWeight="bold">
                      {financialData.paymentMethods.card}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Card
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      {financialData.paymentMethods.digital}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Digital
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
              Key Metrics
            </Typography>
            <Box sx={{ bgcolor: 'grey.50', p: 3, borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                      ${financialData.averageOrderValue}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Order Value
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="secondary.main" fontWeight="bold">
                      {safeStats.totalDeliveries}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Orders
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>

        {/* Revenue Trend Table */}
        <Box mt={4}>
          <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
            Recent Revenue Trend (Last 7 Days)
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Revenue</TableCell>
                  <TableCell>Deliveries</TableCell>
                  <TableCell>Avg per Delivery</TableCell>
                  <TableCell>Growth</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {revenueTrend.map((day, index) => {
                  const avgPerDelivery = day.revenue / day.deliveries;
                  const previousDay = index > 0 ? revenueTrend[index - 1] : null;
                  const growth = previousDay ? ((day.revenue - previousDay.revenue) / previousDay.revenue * 100) : 0;
                  
                  return (
                    <TableRow key={day.date}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {new Date(day.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          ${day.revenue.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {day.deliveries}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          ${avgPerDelivery.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          {growth > 0 ? (
                            <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                          ) : growth < 0 ? (
                            <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                          ) : null}
                          <Typography 
                            variant="body2" 
                            color={growth > 0 ? 'success.main' : growth < 0 ? 'error.main' : 'text.secondary'}
                            fontWeight="medium"
                          >
                            {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>

      {/* Route Optimization & Tracking */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center">
            <RouteIcon color="primary" sx={{ mr: 2, fontSize: 28 }} />
            <Typography variant="h5" component="h2" fontWeight="bold">
              Route Optimization
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RouteIcon />}
            onClick={() => navigate('/route-optimization')}
            size="small"
          >
            Optimize Routes
          </Button>
        </Box>

        <Grid container spacing={4}>
          {/* Route Optimization Overview */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
              Route Optimization
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: 'success.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                  <RouteIcon color="success" sx={{ fontSize: 24, mb: 1 }} />
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {routeOptimization.optimizedRoutes}/{routeOptimization.totalRoutes}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Optimized Routes
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: 'primary.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                  <SpeedIcon color="primary" sx={{ fontSize: 24, mb: 1 }} />
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {routeOptimization.averageEfficiency}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Efficiency
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: 'info.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                  <TimeIcon color="info" sx={{ fontSize: 24, mb: 1 }} />
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    {routeOptimization.timeSaved}m
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Time Saved
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: 'warning.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                  <MoneyIcon color="warning" sx={{ fontSize: 24, mb: 1 }} />
                  <Typography variant="h4" color="warning.main" fontWeight="bold">
                    ${routeOptimization.costSavings}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cost Savings
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>

          {/* Live Tracking Overview */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
              Live Tracking
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: 'success.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                  <MyLocationIcon color="success" sx={{ fontSize: 24, mb: 1 }} />
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {drivers.filter(d => d.isAvailable).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Drivers
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: 'info.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                  <NavigationIcon color="info" sx={{ fontSize: 24, mb: 1 }} />
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    {deliveryRoutes.filter(r => r.status === 'IN_PROGRESS').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Routes
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: 'secondary.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                  <DirectionsIcon color="secondary" sx={{ fontSize: 24, mb: 1 }} />
                  <Typography variant="h4" color="secondary.main" fontWeight="bold">
                    {routeOptimization.totalDistance.toFixed(1)} mi
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Distance
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: 'error.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                  <TrafficIcon color="error" sx={{ fontSize: 24, mb: 1 }} />
                  <Typography variant="h4" color="error.main" fontWeight="bold">
                    {deliveryRoutes.filter(r => r.trafficConditions === 'HEAVY').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Heavy Traffic
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Active Routes Table */}
        <Box mt={4}>
          <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
            Active Delivery Routes
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Driver</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Route</TableCell>
                  <TableCell>Waypoints</TableCell>
                  <TableCell>Distance</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Efficiency</TableCell>
                  <TableCell>Traffic</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deliveryRoutes.map((route) => (
                  <TableRow key={route.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {route.driverName.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {route.driverName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Started: {new Date(route.startTime).toLocaleTimeString()}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={route.status.replace('_', ' ')}
                        color={getRouteStatusColor(route.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {route.startLocation.address.split(',')[0]}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          → {route.endLocation.address.split(',')[0]}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {route.waypoints.map((waypoint, index) => (
                          <Box key={index} display="flex" alignItems="center" mb={0.5}>
                            <Chip
                              label={waypoint.status.replace('_', ' ')}
                              color={getWaypointStatusColor(waypoint.status) as any}
                              size="small"
                              sx={{ mr: 1, minWidth: 80 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {waypoint.orderId}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {route.distance} mi
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {route.actualDuration ? `${route.actualDuration}m` : `${route.estimatedDuration}m`}
                        </Typography>
                        {route.actualDuration && (
                          <Typography variant="body2" color="text.secondary">
                            Est: {route.estimatedDuration}m
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <SpeedIcon sx={{ fontSize: 16, color: 'primary.main', mr: 0.5 }} />
                        <Typography variant="body2" fontWeight="medium">
                          {route.efficiency}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={route.trafficConditions}
                        color={getTrafficColor(route.trafficConditions) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Route">
                          <IconButton size="small" onClick={() => navigate(`/routes/${route.id}`)}>
                            <MapIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Track Live">
                          <IconButton size="small" onClick={() => navigate(`/tracking/${route.id}`)}>
                            <GpsFixedIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Optimize Route">
                          <IconButton size="small" onClick={() => navigate(`/optimize/${route.id}`)}>
                            <RouteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

      </Paper>

      {/* Summary Section */}
      <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <Box display="flex" alignItems="center" mb={3}>
          <TimelineIcon color="primary" sx={{ mr: 2, fontSize: 28 }} />
          <Typography variant="h5" component="h2" fontWeight="bold">
            Today's Summary
          </Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {drivers.filter(d => d.isAvailable).length}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Active Drivers
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {deliveryRoutes.filter(r => r.status === 'IN_PROGRESS').length}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Active Routes
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                ${financialData.dailyRevenue.toLocaleString()}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Today's Revenue
              </Typography>
            </Box>
          </Grid>
        </Grid>
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

      {/* Add Driver Dialog */}
      <Dialog open={openAddDriver} onClose={() => setOpenAddDriver(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Driver</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="First Name"
              value={newDriver.firstName}
              onChange={(e) => setNewDriver(prev => ({ ...prev, firstName: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Last Name"
              value={newDriver.lastName}
              onChange={(e) => setNewDriver(prev => ({ ...prev, lastName: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={newDriver.email}
              onChange={(e) => setNewDriver(prev => ({ ...prev, email: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Phone Number"
              type="tel"
              value={newDriver.phone}
              onChange={(e) => setNewDriver(prev => ({ ...prev, phone: e.target.value }))}
              fullWidth
              required
              placeholder="+1 (555) 123-4567"
            />
            <FormControl fullWidth required>
              <InputLabel>Vehicle Type</InputLabel>
              <Select
                value={newDriver.vehicleType}
                label="Vehicle Type"
                onChange={(e) => setNewDriver(prev => ({ ...prev, vehicleType: e.target.value }))}
              >
                <MenuItem value="Car">Car</MenuItem>
                <MenuItem value="Van">Van</MenuItem>
                <MenuItem value="Truck">Truck</MenuItem>
                <MenuItem value="Motorcycle">Motorcycle</MenuItem>
                <MenuItem value="Bicycle">Bicycle</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Vehicle Model"
              value={newDriver.vehicleModel}
              onChange={(e) => setNewDriver(prev => ({ ...prev, vehicleModel: e.target.value }))}
              fullWidth
              required
              placeholder="e.g., Toyota Camry"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDriver(false)}>Cancel</Button>
          <Button 
            onClick={handleAddDriver} 
            variant="contained" 
            disabled={loading || !newDriver.firstName || !newDriver.lastName || !newDriver.email || !newDriver.phone || !newDriver.vehicleType || !newDriver.vehicleModel}
          >
            {loading ? 'Adding...' : 'Add Driver'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Driver Dialog */}
      <Dialog open={openEditDriver} onClose={() => setOpenEditDriver(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Driver Information</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="First Name"
              value={editDriver.firstName}
              onChange={(e) => setEditDriver(prev => ({ ...prev, firstName: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Last Name"
              value={editDriver.lastName}
              onChange={(e) => setEditDriver(prev => ({ ...prev, lastName: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={editDriver.email}
              onChange={(e) => setEditDriver(prev => ({ ...prev, email: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Phone Number"
              type="tel"
              value={editDriver.phone}
              onChange={(e) => setEditDriver(prev => ({ ...prev, phone: e.target.value }))}
              fullWidth
              required
              placeholder="+1 (555) 123-4567"
            />
            <FormControl fullWidth required>
              <InputLabel>Vehicle Type</InputLabel>
              <Select
                value={editDriver.vehicleType}
                label="Vehicle Type"
                onChange={(e) => setEditDriver(prev => ({ ...prev, vehicleType: e.target.value }))}
              >
                <MenuItem value="Car">Car</MenuItem>
                <MenuItem value="Van">Van</MenuItem>
                <MenuItem value="Truck">Truck</MenuItem>
                <MenuItem value="Motorcycle">Motorcycle</MenuItem>
                <MenuItem value="Bicycle">Bicycle</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Vehicle Model"
              value={editDriver.vehicleModel}
              onChange={(e) => setEditDriver(prev => ({ ...prev, vehicleModel: e.target.value }))}
              fullWidth
              required
              placeholder="e.g., Toyota Camry"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDriver(false)}>Cancel</Button>
          <Button 
            onClick={handleEditDriver} 
            variant="contained" 
            disabled={loading || !editDriver.firstName || !editDriver.lastName || !editDriver.email || !editDriver.phone || !editDriver.vehicleType || !editDriver.vehicleModel}
          >
            {loading ? 'Updating...' : 'Update Driver'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Driver Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <DeleteIcon color="error" sx={{ mr: 1 }} />
            Delete Driver
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete this driver?
          </Typography>
          {selectedDriver && (
            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mt: 2 }}>
              <Typography variant="h6" color="primary.main">
                {selectedDriver.firstName} {selectedDriver.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedDriver.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedDriver.vehicleType} • {selectedDriver.vehicleModel}
              </Typography>
            </Box>
          )}
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. All driver data and performance history will be permanently deleted.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteDriver} 
            variant="contained" 
            color="error"
            disabled={loading}
            startIcon={<DeleteIcon />}
          >
            {loading ? 'Deleting...' : 'Delete Driver'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Account Reset Confirmation Dialog */}
      <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <SecurityIcon color="warning" sx={{ mr: 1 }} />
            Reset Account Password
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to reset the password for:
          </Typography>
          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mt: 2 }}>
            <Typography variant="h6" color="primary.main">
              {selectedUser?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Role: {selectedUser?.role}
            </Typography>
          </Box>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This will generate a new temporary password. The user will need to change it on their next login.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResetDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleResetAccount} 
            variant="contained" 
            color="warning"
            disabled={loading}
            startIcon={<SecurityIcon />}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BusinessDashboard;