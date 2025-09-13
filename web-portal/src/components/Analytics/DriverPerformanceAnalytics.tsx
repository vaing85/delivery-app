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
  LinearProgress,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Avatar,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Star as StarIcon,
  LocalShipping as DeliveryIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Route as RouteIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DriverPerformanceAnalyticsProps {
  driverId: string;
  timeRange: 'week' | 'month' | 'quarter' | 'year';
  onTimeRangeChange: (range: 'week' | 'month' | 'quarter' | 'year') => void;
}

interface PerformanceMetrics {
  overallScore: number;
  onTimeRate: number;
  customerRating: number;
  efficiencyScore: number;
  safetyScore: number;
  earnings: number;
  totalDeliveries: number;
  completedDeliveries: number;
  averageDeliveryTime: number;
  fuelEfficiency: number;
}

interface WeeklyData {
  week: string;
  deliveries: number;
  earnings: number;
  rating: number;
  onTimeRate: number;
}

interface DeliveryTypeData {
  name: string;
  value: number;
  color: string;
}

const DriverPerformanceAnalytics: React.FC<DriverPerformanceAnalyticsProps> = ({
  driverId,
  timeRange,
  onTimeRangeChange
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    overallScore: 87,
    onTimeRate: 94,
    customerRating: 4.7,
    efficiencyScore: 89,
    safetyScore: 92,
    earnings: 2450,
    totalDeliveries: 156,
    completedDeliveries: 148,
    averageDeliveryTime: 28,
    fuelEfficiency: 85
  });

  // Mock data for charts
  const weeklyData: WeeklyData[] = [
    { week: 'Week 1', deliveries: 18, earnings: 320, rating: 4.6, onTimeRate: 92 },
    { week: 'Week 2', deliveries: 22, earnings: 380, rating: 4.7, onTimeRate: 95 },
    { week: 'Week 3', deliveries: 19, earnings: 340, rating: 4.8, onTimeRate: 96 },
    { week: 'Week 4', deliveries: 25, earnings: 420, rating: 4.7, onTimeRate: 94 },
    { week: 'Week 5', deliveries: 21, earnings: 360, rating: 4.9, onTimeRate: 97 },
    { week: 'Week 6', deliveries: 24, earnings: 400, rating: 4.8, onTimeRate: 95 },
    { week: 'Week 7', deliveries: 20, earnings: 350, rating: 4.7, onTimeRate: 93 },
    { week: 'Week 8', deliveries: 23, earnings: 390, rating: 4.8, onTimeRate: 96 },
  ];

  const deliveryTypeData: DeliveryTypeData[] = [
    { name: 'Food Delivery', value: 65, color: '#8884d8' },
    { name: 'Package Delivery', value: 25, color: '#82ca9d' },
    { name: 'Grocery Delivery', value: 10, color: '#ffc658' },
  ];

  const performanceGoals = [
    { metric: 'On-Time Rate', current: 94, target: 90, unit: '%' },
    { metric: 'Customer Rating', current: 4.7, target: 4.5, unit: '/5' },
    { metric: 'Efficiency Score', current: 89, target: 85, unit: '%' },
    { metric: 'Safety Score', current: 92, target: 90, unit: '%' },
  ];

  const recentAchievements = [
    { title: 'Perfect Week', description: '100% on-time delivery rate', date: '2 days ago', icon: <CheckCircleIcon color="success" /> },
    { title: 'Top Performer', description: 'Highest rating in your area', date: '1 week ago', icon: <StarIcon color="warning" /> },
    { title: 'Efficiency Master', description: 'Best fuel efficiency this month', date: '2 weeks ago', icon: <SpeedIcon color="info" /> },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 80) return 'warning';
    return 'error';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <TrendingUpIcon color="success" />;
    if (score >= 80) return <TrendingUpIcon color="warning" />;
    return <TrendingDownIcon color="error" />;
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" gutterBottom>
          Performance Analytics
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => onTimeRangeChange(e.target.value as any)}
          >
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="quarter">This Quarter</MenuItem>
            <MenuItem value="year">This Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Performance Trends" />
        <Tab label="Detailed Metrics" />
        <Tab label="Achievements" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Overall Performance Score */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">Overall Score</Typography>
                  {getScoreIcon(performanceMetrics.overallScore)}
                </Box>
                <Typography variant="h2" color={`${getScoreColor(performanceMetrics.overallScore)}.main`}>
                  {performanceMetrics.overallScore}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Out of 100
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={performanceMetrics.overallScore} 
                  sx={{ mt: 2 }}
                  color={getScoreColor(performanceMetrics.overallScore) as any}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Key Metrics */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              {performanceGoals.map((goal, index) => (
                <Grid item xs={6} sm={3} key={index}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {goal.metric}
                      </Typography>
                      <Typography variant="h5" color="primary.main">
                        {goal.current}{goal.unit}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Target: {goal.target}{goal.unit}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={(goal.current / (goal.target + 10)) * 100} 
                        sx={{ mt: 1 }}
                        color={goal.current >= goal.target ? "success" : "warning"}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Performance Summary */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Summary
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <DeliveryIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="subtitle1">Total Deliveries</Typography>
                    </Box>
                    <Typography variant="h4" color="primary.main">
                      {performanceMetrics.totalDeliveries}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {performanceMetrics.completedDeliveries} completed
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <MoneyIcon color="success" sx={{ mr: 1 }} />
                      <Typography variant="subtitle1">Total Earnings</Typography>
                    </Box>
                    <Typography variant="h4" color="success.main">
                      ${performanceMetrics.earnings.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      This {timeRange}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <TimeIcon color="info" sx={{ mr: 1 }} />
                      <Typography variant="subtitle1">Avg. Delivery Time</Typography>
                    </Box>
                    <Typography variant="h4" color="info.main">
                      {performanceMetrics.averageDeliveryTime}m
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Per delivery
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <SpeedIcon color="warning" sx={{ mr: 1 }} />
                      <Typography variant="subtitle1">Fuel Efficiency</Typography>
                    </Box>
                    <Typography variant="h4" color="warning.main">
                      {performanceMetrics.fuelEfficiency}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Efficiency score
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Trends
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="deliveries" stroke="#8884d8" name="Deliveries" />
                    <Line type="monotone" dataKey="rating" stroke="#82ca9d" name="Rating" />
                    <Line type="monotone" dataKey="onTimeRate" stroke="#ffc658" name="On-Time Rate %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Delivery Types
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={deliveryTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {deliveryTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Weekly Earnings
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="earnings" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Detailed Metrics
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Completion Rate"
                      secondary={`${((performanceMetrics.completedDeliveries / performanceMetrics.totalDeliveries) * 100).toFixed(1)}%`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <StarIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Customer Satisfaction"
                      secondary={`${performanceMetrics.customerRating}/5.0`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <TimeIcon color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Average Response Time"
                      secondary="3.2 minutes"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <RouteIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Route Optimization"
                      secondary="87% efficiency"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Achievements
                </Typography>
                <List>
                  {recentAchievements.map((achievement, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemIcon>
                          {achievement.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={achievement.title}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {achievement.description}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {achievement.date}
                              </Typography>
                            </Box>
                          }
                        />
                        <Chip label="Achieved" color="success" size="small" />
                      </ListItem>
                      {index < recentAchievements.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Insights
                </Typography>
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    You're performing above average in:
                  </Typography>
                  <Chip label="On-Time Delivery" color="success" size="small" sx={{ mr: 1, mb: 1 }} />
                  <Chip label="Customer Rating" color="success" size="small" sx={{ mr: 1, mb: 1 }} />
                  <Chip label="Safety Score" color="success" size="small" />
                </Box>
                
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Areas for improvement:
                  </Typography>
                  <Chip label="Fuel Efficiency" color="warning" size="small" />
                </Box>
                
                <Button variant="outlined" fullWidth>
                  View Detailed Report
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Paper>
  );
};

export default DriverPerformanceAnalytics;
