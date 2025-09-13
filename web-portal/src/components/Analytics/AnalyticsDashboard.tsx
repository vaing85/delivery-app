import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  LocalShipping as DeliveryIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { analyticsAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-toastify';

interface AnalyticsData {
  revenue: any;
  deliveries: any;
  drivers: any;
  customers: any;
  geographic: any;
  business: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('30'); // days
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  // Calculate date range
  const getDateRange = (days: string) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { startDate, endDate } = getDateRange(dateRange);
      const response = await analyticsAPI.getAnalyticsDashboard(startDate, endDate);
      
      if (response.success) {
        setAnalyticsData(response.data);
      } else {
        setError('Failed to fetch analytics data');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to fetch analytics data');
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const renderMetricCard = (title: string, value: string | number, icon: React.ReactNode, trend?: number, subtitle?: string) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="h2">
              {value}
            </Typography>
            {subtitle && (
              <Typography color="textSecondary" variant="body2">
                {subtitle}
              </Typography>
            )}
            {trend !== undefined && (
              <Box display="flex" alignItems="center" mt={1}>
                {trend >= 0 ? (
                  <TrendingUpIcon color="success" fontSize="small" />
                ) : (
                  <TrendingDownIcon color="error" fontSize="small" />
                )}
                <Typography
                  variant="body2"
                  color={trend >= 0 ? 'success.main' : 'error.main'}
                  ml={0.5}
                >
                  {formatPercentage(Math.abs(trend))}
                </Typography>
              </Box>
            )}
          </Box>
          <Box color="primary.main">
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const renderRevenueChart = () => {
    if (!analyticsData?.revenue?.monthlyRevenue) return null;

    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={analyticsData.revenue.monthlyRevenue}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const renderDeliveryStatusChart = () => {
    if (!analyticsData?.deliveries?.deliveriesByStatus) return null;

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={analyticsData.deliveries.deliveriesByStatus}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {analyticsData.deliveries.deliveriesByStatus.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <RechartsTooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderTopDriversTable = () => {
    if (!analyticsData?.drivers?.topPerformers) return null;

    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Driver</TableCell>
              <TableCell align="right">Deliveries</TableCell>
              <TableCell align="right">Rating</TableCell>
              <TableCell align="right">Earnings</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {analyticsData.drivers.topPerformers.slice(0, 5).map((driver: any) => (
              <TableRow key={driver.driverId}>
                <TableCell>{driver.driverName}</TableCell>
                <TableCell align="right">{driver.deliveriesCompleted}</TableCell>
                <TableCell align="right">
                  <Chip
                    label={driver.averageRating.toFixed(1)}
                    color={driver.averageRating >= 4.5 ? 'success' : driver.averageRating >= 4 ? 'primary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">{formatCurrency(driver.totalEarnings)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderPeakHoursChart = () => {
    if (!analyticsData?.business?.peakHours) return null;

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={analyticsData.business.peakHours}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" />
          <YAxis />
          <RechartsTooltip />
          <Bar dataKey="orders" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  if (loading && !analyticsData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={fetchAnalytics}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  if (!analyticsData) {
    return (
      <Alert severity="info">
        No analytics data available. Please try again later.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Analytics Dashboard
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateRange}
              label="Date Range"
              onChange={(e) => setDateRange(e.target.value)}
            >
              <MenuItem value="7">Last 7 days</MenuItem>
              <MenuItem value="30">Last 30 days</MenuItem>
              <MenuItem value="90">Last 90 days</MenuItem>
              <MenuItem value="365">Last year</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchAnalytics} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => toast.info('Export feature coming soon!')}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard(
            'Total Revenue',
            formatCurrency(analyticsData.revenue.totalRevenue),
            <MoneyIcon sx={{ fontSize: 40 }} />,
            analyticsData.revenue.revenueGrowth,
            `Avg: ${formatCurrency(analyticsData.revenue.averageOrderValue)}`
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard(
            'Total Orders',
            analyticsData.business.totalOrders.toLocaleString(),
            <AssessmentIcon sx={{ fontSize: 40 }} />,
            analyticsData.business.orderGrowthRate,
            `${analyticsData.business.customerSatisfactionScore.toFixed(1)}/5.0 rating`
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard(
            'Deliveries',
            analyticsData.deliveries.totalDeliveries.toLocaleString(),
            <DeliveryIcon sx={{ fontSize: 40 }} />,
            undefined,
            `${formatPercentage(analyticsData.deliveries.deliverySuccessRate)} success rate`
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard(
            'Active Drivers',
            analyticsData.drivers.activeDrivers,
            <PeopleIcon sx={{ fontSize: 40 }} />,
            undefined,
            `${analyticsData.drivers.totalDrivers} total drivers`
          )}
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Revenue Trend
            </Typography>
            {renderRevenueChart()}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Delivery Status
            </Typography>
            {renderDeliveryStatusChart()}
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Peak Hours
            </Typography>
            {renderPeakHoursChart()}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Top Performing Drivers
            </Typography>
            {renderTopDriversTable()}
          </Paper>
        </Grid>
      </Grid>

      {/* Additional Metrics */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Customer Segments
            </Typography>
            {analyticsData.customers.customerSegments.map((segment: any) => (
              <Box key={segment.segment} mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">{segment.segment}</Typography>
                  <Typography variant="body2">{segment.count} ({formatPercentage(segment.percentage)})</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={segment.percentage}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="textSecondary">
                  Avg Order: {formatCurrency(segment.averageOrderValue)}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Geographic Distribution
            </Typography>
            {analyticsData.geographic.deliveriesByCity.slice(0, 5).map((city: any) => (
              <Box key={city.city} display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">{city.city}</Typography>
                <Typography variant="body2">{city.count} ({formatPercentage(city.percentage)})</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              System Health
            </Typography>
            <Box mb={2}>
              <Typography variant="body2" gutterBottom>
                System Uptime
              </Typography>
              <LinearProgress
                variant="determinate"
                value={analyticsData.business.systemUptime}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="textSecondary">
                {analyticsData.business.systemUptime}%
              </Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="body2" gutterBottom>
                On-Time Delivery Rate
              </Typography>
              <LinearProgress
                variant="determinate"
                value={analyticsData.deliveries.onTimeDeliveryRate}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="textSecondary">
                {formatPercentage(analyticsData.deliveries.onTimeDeliveryRate)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" gutterBottom>
                Customer Retention
              </Typography>
              <LinearProgress
                variant="determinate"
                value={analyticsData.customers.customerRetentionRate}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="textSecondary">
                {formatPercentage(analyticsData.customers.customerRetentionRate)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard;

