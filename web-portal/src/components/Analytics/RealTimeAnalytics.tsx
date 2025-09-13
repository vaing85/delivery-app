import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
  Badge
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  LocalShipping as DeliveryIcon,
  ShoppingCart as OrderIcon,
  Person as UserIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useWebSocket } from '../../services/websocketService';

interface RealTimeAnalyticsProps {
  onRefresh: () => void;
}

interface LiveMetric {
  id: string;
  label: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

interface LiveEvent {
  id: string;
  type: 'order' | 'delivery' | 'user' | 'payment';
  message: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'success' | 'error';
}

const RealTimeAnalytics: React.FC<RealTimeAnalyticsProps> = ({ onRefresh }) => {
  const [liveMetrics, setLiveMetrics] = useState<LiveMetric[]>([
    {
      id: '1',
      label: 'Active Orders',
      value: 24,
      change: 12.5,
      changeType: 'increase',
      icon: <OrderIcon />,
      color: '#1976d2'
    },
    {
      id: '2',
      label: 'In Transit',
      value: 8,
      change: -5.2,
      changeType: 'decrease',
      icon: <DeliveryIcon />,
      color: '#ed6c02'
    },
    {
      id: '3',
      label: 'Online Drivers',
      value: 15,
      change: 8.3,
      changeType: 'increase',
      icon: <UserIcon />,
      color: '#2e7d32'
    },
    {
      id: '4',
      label: 'Today\'s Revenue',
      value: 2847,
      change: 15.7,
      changeType: 'increase',
      icon: <MoneyIcon />,
      color: '#9c27b0'
    }
  ]);

  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([
    {
      id: '1',
      type: 'order',
      message: 'New order #ORD-001 created by John Doe',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      severity: 'info'
    },
    {
      id: '2',
      type: 'delivery',
      message: 'Delivery #DEL-002 completed successfully',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      severity: 'success'
    },
    {
      id: '3',
      type: 'user',
      message: 'New driver Mike Johnson registered',
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      severity: 'info'
    },
    {
      id: '4',
      type: 'delivery',
      message: 'Delivery #DEL-003 delayed due to traffic',
      timestamp: new Date(Date.now() - 12 * 60 * 1000),
      severity: 'warning'
    }
  ]);

  const [orderTrendData] = useState([
    { time: '00:00', orders: 2 },
    { time: '02:00', orders: 1 },
    { time: '04:00', orders: 0 },
    { time: '06:00', orders: 3 },
    { time: '08:00', orders: 8 },
    { time: '10:00', orders: 12 },
    { time: '12:00', orders: 15 },
    { time: '14:00', orders: 18 },
    { time: '16:00', orders: 22 },
    { time: '18:00', orders: 19 },
    { time: '20:00', orders: 14 },
    { time: '22:00', orders: 8 }
  ]);

  const [statusDistribution] = useState([
    { name: 'Pending', value: 12, color: '#ff9800' },
    { name: 'In Transit', value: 8, color: '#2196f3' },
    { name: 'Delivered', value: 45, color: '#4caf50' },
    { name: 'Failed', value: 3, color: '#f44336' }
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update metrics with small random changes
      setLiveMetrics(prev => prev.map(metric => ({
        ...metric,
        value: Math.max(0, metric.value + Math.floor(Math.random() * 3) - 1),
        change: parseFloat((Math.random() * 20 - 10).toFixed(1))
      })));

      // Add new events occasionally
      if (Math.random() > 0.7) {
        const newEvent: LiveEvent = {
          id: Date.now().toString(),
          type: ['order', 'delivery', 'user', 'payment'][Math.floor(Math.random() * 4)] as any,
          message: `Live event ${Date.now()}`,
          timestamp: new Date(),
          severity: ['info', 'success', 'warning'][Math.floor(Math.random() * 3)] as any
        };
        setLiveEvents(prev => [newEvent, ...prev.slice(0, 9)]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success': return '#4caf50';
      case 'warning': return '#ff9800';
      case 'error': return '#f44336';
      default: return '#2196f3';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'order': return <OrderIcon />;
      case 'delivery': return <DeliveryIcon />;
      case 'user': return <UserIcon />;
      case 'payment': return <MoneyIcon />;
      default: return <NotificationIcon />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Real-Time Analytics
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton onClick={onRefresh} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {/* Live Metrics */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Live Metrics
            </Typography>
            <Grid container spacing={2}>
              {liveMetrics.map((metric) => (
                <Grid item xs={12} sm={6} md={3} key={metric.id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="h4" color={metric.color}>
                            {metric.value}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {metric.label}
                          </Typography>
                        </Box>
                        <Box color={metric.color}>
                          {metric.icon}
                        </Box>
                      </Box>
                      <Box display="flex" alignItems="center" mt={1}>
                        {metric.changeType === 'increase' ? (
                          <TrendingUpIcon color="success" fontSize="small" />
                        ) : metric.changeType === 'decrease' ? (
                          <TrendingDownIcon color="error" fontSize="small" />
                        ) : null}
                        <Typography 
                          variant="body2" 
                          color={metric.changeType === 'increase' ? 'success.main' : 
                                metric.changeType === 'decrease' ? 'error.main' : 'text.secondary'}
                          sx={{ ml: 0.5 }}
                        >
                          {metric.change > 0 ? '+' : ''}{metric.change}%
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Order Trend Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Order Activity (Last 24 Hours)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={orderTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <RechartsTooltip />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#1976d2" 
                  strokeWidth={2}
                  dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Status Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Order Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Live Events Feed */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Typography variant="h6">
                Live Events Feed
              </Typography>
              <Badge badgeContent={liveEvents.length} color="primary" sx={{ ml: 2 }}>
                <NotificationIcon />
              </Badge>
            </Box>
            <List>
              {liveEvents.map((event, index) => (
                <React.Fragment key={event.id}>
                  <ListItem>
                    <ListItemIcon>
                      <Box color={getSeverityColor(event.severity)}>
                        {getEventIcon(event.type)}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={event.message}
                      secondary={`${formatTime(event.timestamp)} - ${event.severity.toUpperCase()}`}
                    />
                    <Chip 
                      label={event.type} 
                      size="small" 
                      color={event.severity === 'success' ? 'success' : 
                             event.severity === 'warning' ? 'warning' : 
                             event.severity === 'error' ? 'error' : 'default'}
                    />
                  </ListItem>
                  {index < liveEvents.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RealTimeAnalytics;
