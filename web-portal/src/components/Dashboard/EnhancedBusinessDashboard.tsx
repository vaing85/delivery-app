import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Tabs,
  Tab,
  LinearProgress,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  Assessment as AnalyticsIcon,
  People as PeopleIcon,
  Map as MapIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  LocalShipping as DeliveryIcon,
  Star as StarIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  ShoppingCart as OrdersIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface BusinessDashboardProps {
  stats: {
    totalDrivers: number;
    totalDeliveries: number;
    totalRevenue: number;
    averageRating: number;
  };
  onRefresh: () => void;
}

const EnhancedBusinessDashboard: React.FC<BusinessDashboardProps> = ({ stats, onRefresh }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  // Mock data for enhanced features
  const financialData = {
    dailyRevenue: 2847.50,
    weeklyRevenue: 19832.75,
    monthlyRevenue: 75640.20,
    profitMargin: 23.5,
    averageOrderValue: 45.80,
    paymentMethods: { cash: 35, card: 45, digital: 20 },
    expenses: { fuel: 1250.00, maintenance: 850.00, insurance: 1200.00, other: 400.00 },
  };

  const performanceMetrics = {
    deliverySuccessRate: 96.8,
    averageDeliveryTime: 28.5,
    customerSatisfaction: 4.7,
    onTimeDeliveryRate: 94.2,
    peakHours: ['12:00-14:00', '18:00-20:00'],
    topPerformingZones: ['Downtown', 'Business District', 'Residential North'],
  };

  const customerAnalytics = {
    totalCustomers: 1247,
    activeCustomers: 892,
    newCustomers: 45,
    retentionRate: 78.5,
    averageLifetimeValue: 156.80,
    customerSatisfactionScore: 4.6,
    repeatCustomerRate: 72.3,
  };

  const operationalData = {
    activeDrivers: 8,
    inactiveDrivers: 2,
    vehicleUtilization: 87.5,
    routeEfficiency: 92.3,
    systemUptime: 99.8,
    alerts: 3,
  };

  const drivers = [
    {
      id: '1',
      name: 'John Smith',
      status: 'Active',
      location: 'Downtown',
      lastActive: '2 min ago',
      rating: 4.8,
      deliveries: 156,
      earnings: 2847.50,
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      status: 'Offline',
      location: 'Business District',
      lastActive: '15 min ago',
      rating: 4.9,
      deliveries: 203,
      earnings: 3201.75,
    },
    {
      id: '3',
      name: 'Mike Davis',
      status: 'Active',
      location: 'Residential North',
      lastActive: '1 min ago',
      rating: 4.6,
      deliveries: 89,
      earnings: 1654.20,
    },
  ];

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      {/* Business Info */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Business Information
            </Typography>
            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                Delivery Express Inc.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                123 Business Ave, City, State 12345
              </Typography>
              <Typography variant="body2" color="text.secondary">
                +1 (555) 123-4567
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Key Metrics */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Key Metrics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {stats.totalDeliveries}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Deliveries
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    ${stats.totalRevenue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h4" color="warning.main" fontWeight="bold">
                    {stats.averageRating.toFixed(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Rating
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {customerAnalytics.totalCustomers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Customers
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderFinancialTab = () => (
    <Grid container spacing={3}>
      {/* Revenue Overview */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Revenue Overview
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box textAlign="center" sx={{ bgcolor: 'primary.50', p: 2, borderRadius: 1 }}>
                  <Typography variant="h5" color="primary.main" fontWeight="bold">
                    ${financialData.dailyRevenue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Daily Revenue
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center" sx={{ bgcolor: 'success.50', p: 2, borderRadius: 1 }}>
                  <Typography variant="h5" color="success.main" fontWeight="bold">
                    ${financialData.weeklyRevenue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Weekly Revenue
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center" sx={{ bgcolor: 'info.50', p: 2, borderRadius: 1 }}>
                  <Typography variant="h5" color="info.main" fontWeight="bold">
                    ${financialData.monthlyRevenue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monthly Revenue
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Financial Metrics */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Financial Metrics
            </Typography>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Profit Margin
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={financialData.profitMargin} 
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="body2" color="primary.main" fontWeight="medium">
                {financialData.profitMargin}%
              </Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Average Order Value
              </Typography>
              <Typography variant="h6" color="success.main" fontWeight="bold">
                ${financialData.averageOrderValue}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Payment Methods */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Payment Methods
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Cash</Typography>
                <Chip label={`${financialData.paymentMethods.cash}%`} color="primary" size="small" />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Card</Typography>
                <Chip label={`${financialData.paymentMethods.card}%`} color="success" size="small" />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Digital</Typography>
                <Chip label={`${financialData.paymentMethods.digital}%`} color="info" size="small" />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Expenses */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Monthly Expenses
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Fuel</Typography>
                <Typography variant="body2" fontWeight="medium">
                  ${financialData.expenses.fuel.toLocaleString()}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Maintenance</Typography>
                <Typography variant="body2" fontWeight="medium">
                  ${financialData.expenses.maintenance.toLocaleString()}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Insurance</Typography>
                <Typography variant="body2" fontWeight="medium">
                  ${financialData.expenses.insurance.toLocaleString()}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Other</Typography>
                <Typography variant="body2" fontWeight="medium">
                  ${financialData.expenses.other.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderPerformanceTab = () => (
    <Grid container spacing={3}>
      {/* Performance Metrics */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Performance Metrics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box textAlign="center" sx={{ bgcolor: 'success.50', p: 2, borderRadius: 1 }}>
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {performanceMetrics.deliverySuccessRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Delivery Success Rate
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center" sx={{ bgcolor: 'info.50', p: 2, borderRadius: 1 }}>
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    {performanceMetrics.averageDeliveryTime}min
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Delivery Time
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center" sx={{ bgcolor: 'warning.50', p: 2, borderRadius: 1 }}>
                  <Typography variant="h4" color="warning.main" fontWeight="bold">
                    {performanceMetrics.customerSatisfaction}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Customer Satisfaction
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center" sx={{ bgcolor: 'primary.50', p: 2, borderRadius: 1 }}>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {performanceMetrics.onTimeDeliveryRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    On-Time Delivery Rate
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Peak Hours & Zones */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Peak Hours
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              {performanceMetrics.peakHours.map((hour, index) => (
                <Chip key={index} label={hour} color="primary" size="small" />
              ))}
            </Box>
            <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
              Top Zones
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              {performanceMetrics.topPerformingZones.map((zone, index) => (
                <Chip key={index} label={zone} color="success" size="small" />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderCustomerTab = () => (
    <Grid container spacing={3}>
      {/* Customer Overview */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Customer Analytics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box textAlign="center" sx={{ bgcolor: 'primary.50', p: 2, borderRadius: 1 }}>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {customerAnalytics.totalCustomers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Customers
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center" sx={{ bgcolor: 'success.50', p: 2, borderRadius: 1 }}>
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {customerAnalytics.activeCustomers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Customers
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center" sx={{ bgcolor: 'info.50', p: 2, borderRadius: 1 }}>
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    {customerAnalytics.newCustomers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    New This Month
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Customer Metrics */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Customer Metrics
            </Typography>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Retention Rate
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={customerAnalytics.retentionRate} 
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="body2" color="primary.main" fontWeight="medium">
                {customerAnalytics.retentionRate}%
              </Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Avg Lifetime Value
              </Typography>
              <Typography variant="h6" color="success.main" fontWeight="bold">
                ${customerAnalytics.averageLifetimeValue}
              </Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Satisfaction Score
              </Typography>
              <Typography variant="h6" color="warning.main" fontWeight="bold">
                {customerAnalytics.customerSatisfactionScore}/5.0
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderRealTimeTab = () => (
    <Grid container spacing={3}>
      {/* Live Driver Status */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Live Driver Status
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Driver</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Last Active</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Deliveries</TableCell>
                    <TableCell>Earnings</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {drivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                            {driver.name.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          {driver.name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={driver.status} 
                          color={driver.status === 'Active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{driver.location}</TableCell>
                      <TableCell>{driver.lastActive}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <StarIcon sx={{ fontSize: 16, color: 'warning.main', mr: 0.5 }} />
                          {driver.rating}
                        </Box>
                      </TableCell>
                      <TableCell>{driver.deliveries}</TableCell>
                      <TableCell>${driver.earnings.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderOperationsTab = () => (
    <Grid container spacing={3}>
      {/* Operational Metrics */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Operational Metrics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box textAlign="center" sx={{ bgcolor: 'info.50', p: 2, borderRadius: 1 }}>
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    {operationalData.vehicleUtilization}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vehicle Utilization
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center" sx={{ bgcolor: 'primary.50', p: 2, borderRadius: 1 }}>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {operationalData.routeEfficiency}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Route Efficiency
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* System Status */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              System Status
            </Typography>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                System Uptime
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={operationalData.systemUptime} 
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="body2" color="success.main" fontWeight="medium">
                {operationalData.systemUptime}%
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Active Alerts
              </Typography>
              <Badge badgeContent={operationalData.alerts} color="error">
                <WarningIcon color="warning" />
              </Badge>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return renderOverviewTab();
      case 1:
        return renderFinancialTab();
      case 2:
        return renderPerformanceTab();
      case 3:
        return renderCustomerTab();
      case 4:
        return renderRealTimeTab();
      case 5:
        return renderOperationsTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <Paper sx={{ p: 4, mt: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <BusinessIcon color="primary" sx={{ mr: 2, fontSize: 32 }} />
        <Typography variant="h5" component="h2" fontWeight="bold">
          Enhanced Business Dashboard
        </Typography>
      </Box>

      {/* Dashboard Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Overview" icon={<BusinessIcon />} />
          <Tab label="Financial Analytics" icon={<MoneyIcon />} />
          <Tab label="Performance Metrics" icon={<AnalyticsIcon />} />
          <Tab label="Customer Analytics" icon={<PeopleIcon />} />
          <Tab label="Real-time Monitoring" icon={<MapIcon />} />
          <Tab label="Operations" icon={<SettingsIcon />} />
          <Tab label="Orders" icon={<OrdersIcon />} onClick={() => navigate('/orders')} />
          <Tab label="Deliveries" icon={<DeliveryIcon />} onClick={() => navigate('/deliveries')} />
          <Tab label="Drivers" icon={<PeopleIcon />} onClick={() => navigate('/drivers')} />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {renderTabContent()}
    </Paper>
  );
};

export default EnhancedBusinessDashboard;
