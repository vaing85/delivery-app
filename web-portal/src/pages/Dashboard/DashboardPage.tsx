import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ShoppingCart as OrderIcon,
  LocalShipping as DeliveryIcon,
  Notifications as NotificationIcon,
  Person as UserIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon,
  People as UsersIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { ordersAPI, deliveriesAPI, usersAPI, notificationsAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { AdminDashboard, EnhancedAdminDashboard, CustomerDashboard, DriverDashboard, BusinessDashboard, AdminBusinessDashboard } from '../../components/Dashboard';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  totalDeliveries: number;
  activeDeliveries: number;
  totalUsers: number;
  totalDrivers: number;
  totalCustomers: number;
  totalBusiness: number;
  unreadNotifications: number;
}

interface OrderTrend {
  date: string;
  orders: number;
  deliveries: number;
}

interface StatusDistribution {
  status: string;
  count: number;
  color: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const { isAuthenticated, user } = useAuthStore();

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboard-stats', refreshKey, user?.role],
    queryFn: async (): Promise<DashboardStats> => {
      // Different API calls based on user role
      if (user?.role === 'ADMIN') {
        // Admin can see all data
        const [ordersRes, deliveriesRes, usersRes, notificationsRes] = await Promise.all([
          ordersAPI.getOrders({ limit: 1000 }),
          deliveriesAPI.getDeliveries({ limit: 1000 }),
          usersAPI.getUsers({ limit: 1000 }),
          notificationsAPI.getUnreadCount()
        ]);

        const orders = ordersRes.data;
        const deliveries = deliveriesRes.data;
        const users = usersRes.data;

        return {
          totalOrders: orders.length,
          pendingOrders: orders.filter(o => o.status === 'PENDING').length,
          inProgressOrders: orders.filter(o => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status)).length,
          completedOrders: orders.filter(o => o.status === 'DELIVERED').length,
          totalDeliveries: deliveries.length,
          activeDeliveries: deliveries.filter(d => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status)).length,
          totalUsers: users.length,
          totalDrivers: users.filter(u => u.role === 'DRIVER').length,
          totalCustomers: users.filter(u => u.role === 'CUSTOMER').length,
          totalBusiness: users.filter(u => u.role === 'BUSINESS').length,
          unreadNotifications: notificationsRes.data.unreadCount
        };
             } else if (user?.role === 'DRIVER') {
         // Driver can only see their own deliveries and related orders
         const [deliveriesRes, notificationsRes] = await Promise.all([
           deliveriesAPI.getDeliveries({ limit: 100 }), // Use smaller limit for drivers
           notificationsAPI.getUnreadCount()
         ]);

        const deliveries = deliveriesRes.data;
        const driverDeliveries = deliveries.filter(d => d.driverId === user.id);
        const driverOrders = driverDeliveries.map(d => d.order);

        return {
          totalOrders: driverOrders.length,
          pendingOrders: driverOrders.filter(o => o.status === 'PENDING').length,
          inProgressOrders: driverOrders.filter(o => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status)).length,
          completedOrders: driverOrders.filter(o => o.status === 'DELIVERED').length,
          totalDeliveries: driverDeliveries.length,
          activeDeliveries: driverDeliveries.filter(d => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status)).length,
          totalUsers: 0, // Driver can't see user counts
          totalDrivers: 1, // Just themselves
          totalCustomers: 0, // Driver can't see customer counts
          totalBusiness: 0, // Driver can't see business counts
          unreadNotifications: notificationsRes.data.unreadCount
        };
             } else if (user?.role === 'BUSINESS') {
         // Business can see their drivers and related data
         const [deliveriesRes, usersRes, notificationsRes] = await Promise.all([
           deliveriesAPI.getDeliveries({ limit: 1000 }),
           usersAPI.getUsers({ limit: 1000 }),
           notificationsAPI.getUnreadCount()
         ]);

        const deliveries = deliveriesRes.data;
        const users = usersRes.data;
        const businessDrivers = users.filter(u => u.role === 'DRIVER');
        
        // Get orders from deliveries (business sees orders through their drivers)
        const businessOrders = deliveries.map(d => d.order);

        return {
          totalOrders: businessOrders.length,
          pendingOrders: businessOrders.filter(o => o.status === 'PENDING').length,
          inProgressOrders: businessOrders.filter(o => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status)).length,
          completedOrders: businessOrders.filter(o => o.status === 'DELIVERED').length,
          totalDeliveries: deliveries.length,
          activeDeliveries: deliveries.filter(d => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status)).length,
          totalUsers: businessDrivers.length,
          totalDrivers: businessDrivers.length,
          totalCustomers: 0, // Business can't see customer counts
          totalBusiness: 1, // Just themselves
          unreadNotifications: notificationsRes.data.unreadCount
        };
             } else {
         // Customer can only see their own orders
         const [ordersRes, notificationsRes] = await Promise.all([
           ordersAPI.getOrders({ limit: 100 }), // Use smaller limit for customers
           notificationsAPI.getUnreadCount()
         ]);

        const orders = ordersRes.data;
        const customerOrders = orders.filter(o => o.customerId === user.id);

        return {
          totalOrders: customerOrders.length,
          pendingOrders: customerOrders.filter(o => o.status === 'PENDING').length,
          inProgressOrders: customerOrders.filter(o => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status)).length,
          completedOrders: customerOrders.filter(o => o.status === 'DELIVERED').length,
          totalDeliveries: 0, // Customer can't see delivery counts
          activeDeliveries: 0,
          totalUsers: 0, // Customer can't see user counts
          totalDrivers: 0,
          totalCustomers: 1, // Just themselves
          totalBusiness: 0, // Customer can't see business counts
          unreadNotifications: notificationsRes.data.unreadCount
        };
      }
    },
    enabled: isAuthenticated && !!user
  });

  // Fetch recent orders (reuse data from stats if available)
  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders', refreshKey, user?.role],
    queryFn: async () => {
             if (user?.role === 'DRIVER') {
         // Driver sees orders from their deliveries
         const deliveriesRes = await deliveriesAPI.getDeliveries({ limit: 100 }); // Use smaller limit
         const driverDeliveries = deliveriesRes.data.filter(d => d.driverId === user.id);
         const driverOrders = driverDeliveries.map(d => d.order).slice(0, 5);
         return driverOrders;
       } else if (user?.role === 'BUSINESS') {
         // Business sees orders from their drivers' deliveries
         const deliveriesRes = await deliveriesAPI.getDeliveries({ limit: 100 }); // Use smaller limit
         const businessOrders = deliveriesRes.data.map(d => d.order).slice(0, 5);
         return businessOrders;
       } else if (user?.role === 'CUSTOMER') {
         // Customer sees their own orders
         const response = await ordersAPI.getOrders({ limit: 100 }); // Use smaller limit
         const customerOrders = response.data.filter(o => o.customerId === user.id);
         return customerOrders;
       } else {
         // Admin sees all orders
         const response = await ordersAPI.getOrders({ limit: 5 });
         return response.data;
       }
    },
    enabled: isAuthenticated && !!user,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Fetch recent deliveries (reuse data from stats if available)
  const { data: recentDeliveries } = useQuery({
    queryKey: ['recent-deliveries', refreshKey, user?.role],
    queryFn: async () => {
             if (user?.role === 'DRIVER') {
         // Driver sees their own deliveries
         const response = await deliveriesAPI.getDeliveries({ limit: 100 }); // Use smaller limit
         const driverDeliveries = response.data.filter(d => d.driverId === user.id).slice(0, 5);
         return driverDeliveries;
       } else if (user?.role === 'BUSINESS') {
         // Business sees all deliveries from their drivers
         const response = await deliveriesAPI.getDeliveries({ limit: 100 }); // Use smaller limit
         return response.data.slice(0, 5);
       } else if (user?.role === 'CUSTOMER') {
         // Customer doesn't see deliveries
         return [];
       } else {
         // Admin sees all deliveries
         const response = await deliveriesAPI.getDeliveries({ limit: 5 });
         return response.data;
       }
    },
    enabled: isAuthenticated && !!user,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Fetch recent notifications
  const { data: recentNotifications } = useQuery({
    queryKey: ['recent-notifications', refreshKey],
    queryFn: async () => {
      const response = await notificationsAPI.getNotifications({ limit: 10 });
      return response.data;
    },
    enabled: isAuthenticated && !!user,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Fetch order trends (reuse data from stats if available)
  const { data: orderTrends } = useQuery({
    queryKey: ['order-trends', refreshKey, user?.role],
    queryFn: async (): Promise<OrderTrend[]> => {
      let orders: any[] = [];
      
             if (user?.role === 'DRIVER') {
         // Driver sees trends from their deliveries
         const deliveriesRes = await deliveriesAPI.getDeliveries({ limit: 100 }); // Use smaller limit
         const driverDeliveries = deliveriesRes.data.filter(d => d.driverId === user.id);
         orders = driverDeliveries.map(d => d.order);
       } else if (user?.role === 'CUSTOMER') {
         // Customer sees trends from their orders
         const response = await ordersAPI.getOrders({ limit: 100 }); // Use smaller limit
         orders = response.data.filter(o => o.customerId === user.id);
       } else {
         // Admin sees all orders
         const response = await ordersAPI.getOrders({ limit: 1000 });
         orders = response.data;
       }
      
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      return last7Days.map(date => ({
        date,
        orders: orders.filter(o => o.createdAt.startsWith(date)).length,
        deliveries: orders.filter(o => o.status === 'DELIVERED' && o.updatedAt.startsWith(date)).length
      }));
    },
    enabled: isAuthenticated && !!user,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Generate status distribution data
  const statusDistribution: StatusDistribution[] = stats ? [
    { status: 'Pending', count: stats.pendingOrders, color: '#FF9800' },
    { status: 'In Progress', count: stats.inProgressOrders, color: '#2196F3' },
    { status: 'Completed', count: stats.completedOrders, color: '#4CAF50' },
    { status: 'Failed', count: stats.totalOrders - stats.pendingOrders - stats.inProgressOrders - stats.completedOrders, color: '#F44336' }
  ] : [];



  // Show loading state if not authenticated
  if (!isAuthenticated) {
    return (
      <Box p={3}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={40} />
        </Box>
      </Box>
    );
  }

  if (statsError) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load dashboard data. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
      </Box>

      {/* Stats Cards - Only show for Admin and Driver users */}
      {user?.role !== 'CUSTOMER' && (
        <Grid container spacing={3} mb={4}>
          {/* For Admin Users - Show 5 cards in a symmetrical grid */}
          {user?.role === 'ADMIN' ? (
            <>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Total Orders
                        </Typography>
                        <Typography variant="h4">
                          {statsLoading ? <CircularProgress size={24} /> : stats?.totalOrders || 0}
                        </Typography>
                      </Box>
                      <OrderIcon color="primary" sx={{ fontSize: 40 }} />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/orders')}>
                      View All
                    </Button>
                  </CardActions>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Pending Orders
                        </Typography>
                        <Typography variant="h4" color="warning.main">
                          {statsLoading ? <CircularProgress size={24} /> : stats?.pendingOrders || 0}
                        </Typography>
                      </Box>
                      <OrderIcon color="warning" sx={{ fontSize: 40 }} />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/orders')}>
                      View All
                    </Button>
                  </CardActions>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Active Deliveries
                        </Typography>
                        <Typography variant="h4">
                          {statsLoading ? <CircularProgress size={24} /> : stats?.activeDeliveries || 0}
                        </Typography>
                      </Box>
                      <DeliveryIcon color="secondary" sx={{ fontSize: 40 }} />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/deliveries')}>
                      View All
                    </Button>
                  </CardActions>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Total Users
                        </Typography>
                        <Typography variant="h4">
                          {statsLoading ? <CircularProgress size={24} /> : stats?.totalUsers || 0}
                        </Typography>
                      </Box>
                      <UserIcon color="success" sx={{ fontSize: 40 }} />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/users')}>
                      View All
                    </Button>
                  </CardActions>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Total Business
                        </Typography>
                        <Typography variant="h4" color="info.main">
                          {statsLoading ? <CircularProgress size={24} /> : stats?.totalBusiness || 0}
                        </Typography>
                      </Box>
                      <UsersIcon color="info" sx={{ fontSize: 40 }} />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/users')}>
                      View All
                    </Button>
                  </CardActions>
                </Card>
              </Grid>

              
            </>
          ) : (
            <>
              {/* For Driver Users - Show relevant cards */}
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Total Orders
                        </Typography>
                        <Typography variant="h4">
                          {statsLoading ? <CircularProgress size={24} /> : stats?.totalOrders || 0}
                        </Typography>
                      </Box>
                      <OrderIcon color="primary" sx={{ fontSize: 40 }} />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/orders')}>
                      View All
                    </Button>
                  </CardActions>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Pending Orders
                        </Typography>
                        <Typography variant="h4" color="warning.main">
                          {statsLoading ? <CircularProgress size={24} /> : stats?.pendingOrders || 0}
                        </Typography>
                      </Box>
                      <OrderIcon color="warning" sx={{ fontSize: 40 }} />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/orders')}>
                      View All
                    </Button>
                  </CardActions>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Active Deliveries
                        </Typography>
                        <Typography variant="h4">
                          {statsLoading ? <CircularProgress size={24} /> : stats?.activeDeliveries || 0}
                        </Typography>
                      </Box>
                      <DeliveryIcon color="secondary" sx={{ fontSize: 40 }} />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/deliveries')}>
                      View All
                    </Button>
                  </CardActions>
                </Card>
              </Grid>

              
            </>
          )}
        </Grid>
      )}

             {/* Charts Row - Only show for Admin */}
       {user?.role === 'ADMIN' && (
         <Grid container spacing={3} mb={4}>
           {/* Order Trends Chart */}
           <Grid item xs={12} lg={8}>
             <Paper sx={{ p: 3 }}>
               <Typography variant="h6" mb={2}>
                 Order Trends (Last 7 Days)
               </Typography>
               <ResponsiveContainer width="100%" height={300}>
                 <LineChart data={orderTrends || []}>
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis dataKey="date" />
                   <YAxis />
                   <RechartsTooltip />
                   <Line type="monotone" dataKey="orders" stroke="#8884d8" strokeWidth={2} name="Orders" />
                   <Line type="monotone" dataKey="deliveries" stroke="#82ca9d" strokeWidth={2} name="Deliveries" />
                 </LineChart>
               </ResponsiveContainer>
             </Paper>
           </Grid>

           {/* Status Distribution */}
           <Grid item xs={12} lg={4}>
             <Paper sx={{ p: 3 }}>
               <Typography variant="h6" mb={2}>
                 Order Status Distribution
               </Typography>
               <ResponsiveContainer width="100%" height={300}>
                 <PieChart>
                   <Pie
                     data={statusDistribution}
                     cx="50%"
                     cy="50%"
                     labelLine={false}
                     label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                     outerRadius={80}
                     fill="#8884d8"
                     dataKey="count"
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
         </Grid>
       )}

             {/* Recent Activity Row */}
       <Grid container spacing={3}>
         {/* Recent Orders - Show for Admin and Driver only */}
         {(user?.role === 'ADMIN' || user?.role === 'DRIVER') && (
           <Grid item xs={12} md={6}>
             <Paper sx={{ p: 3, width: '100%', minHeight: '400px' }}>
               <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                 <Typography variant="h6">
                   {user?.role === 'DRIVER' ? 'My Assigned Orders' : 'Recent Orders'}
                 </Typography>
                 <Button size="small" onClick={() => navigate('/orders')}>
                   View All
                 </Button>
               </Box>
               <List>
                 {recentOrders?.map((order, index) => (
                   <React.Fragment key={order.id}>
                     <ListItem>
                       <ListItemIcon>
                         <OrderIcon color="primary" />
                       </ListItemIcon>
                       <ListItemText
                         primary={`${order.orderNumber} - ${order.customer.firstName} ${order.customer.lastName}`}
                         secondary={`${order.pickupAddress} → ${order.deliveryAddress}`}
                       />
                       <Box display="flex" alignItems="center" gap={1} ml={2}>
                         <Chip
                           label={order.status}
                           size="small"
                           color={
                             order.status === 'DELIVERED' ? 'success' :
                             order.status === 'PENDING' ? 'warning' :
                             'primary'
                           }
                         />
                         <Typography variant="caption" color="text.secondary">
                           ${typeof order.total === 'number' ? order.total.toFixed(2) : order.total}
                         </Typography>
                       </Box>
                       <IconButton size="small" onClick={() => navigate(`/orders/${order.id}`)}>
                         <ViewIcon />
                       </IconButton>
                     </ListItem>
                     {index < recentOrders.length - 1 && <Divider />}
                   </React.Fragment>
                 ))}
               </List>
             </Paper>
           </Grid>
         )}

        {/* Recent Deliveries - Only show for Admin and Driver */}
        {(user?.role === 'ADMIN' || user?.role === 'DRIVER') && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, width: '100%', minHeight: '400px' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  {user?.role === 'DRIVER' ? 'My Deliveries' : 'Recent Deliveries'}
                </Typography>
                <Button size="small" onClick={() => navigate('/deliveries')}>
                  View All
                </Button>
              </Box>
              <List>
                {recentDeliveries?.map((delivery, index) => (
                  <React.Fragment key={delivery.id}>
                    <ListItem>
                      <ListItemIcon>
                        <DeliveryIcon color="secondary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Order ${delivery.order.orderNumber}`}
                        secondary={`Driver: ${delivery.driver.firstName} ${delivery.driver.lastName}`}
                      />
                      <Box display="flex" alignItems="center" gap={1} ml={2}>
                        <Chip
                          label={delivery.status}
                          size="small"
                          color={
                            delivery.status === 'DELIVERED' ? 'success' :
                            delivery.status === 'ASSIGNED' ? 'info' :
                            'primary'
                          }
                        />
                        {delivery.estimatedDuration && (
                          <Typography variant="caption" color="text.secondary">
                            Est: {delivery.estimatedDuration} min
                          </Typography>
                        )}
                      </Box>
                      <IconButton size="small" onClick={() => navigate(`/deliveries/${delivery.id}`)}>
                        <ViewIcon />
                      </IconButton>
                    </ListItem>
                    {index < recentDeliveries.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>
        )}
      </Grid>

             {/* Recent Notifications Section - Show for Admin and Driver only */}
       {(user?.role === 'ADMIN' || user?.role === 'DRIVER') && (
         <Paper sx={{ p: 3, mb: 4 }}>
           <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
             <Typography variant="h6">
               Recent Notifications
             </Typography>
             <Button size="small" onClick={() => navigate('/notifications')}>
               View All
             </Button>
           </Box>
           <List>
             {recentNotifications?.slice(0, 5).map((notification, index) => (
               <React.Fragment key={notification.id}>
                 <ListItem>
                   <ListItemIcon>
                     <NotificationIcon color="primary" />
                   </ListItemIcon>
                   <ListItemText
                     primary={notification.title}
                     secondary={
                       <Box>
                         <Typography variant="body2" color="text.secondary">
                           {notification.message}
                         </Typography>
                         <Typography variant="caption" color="text.secondary">
                           {new Date(notification.createdAt).toLocaleDateString()}
                         </Typography>
                       </Box>
                     }
                   />
                   <Box display="flex" alignItems="center" gap={1} ml={2}>
                     <Chip
                       label={notification.type}
                       size="small"
                       color={
                         notification.type === 'URGENT' ? 'error' :
                         notification.type === 'INFO' ? 'info' :
                         'default'
                       }
                     />
                     {!notification.isRead && (
                       <Chip
                         label="New"
                         size="small"
                         color="primary"
                         variant="outlined"
                       />
                     )}
                   </Box>
                 </ListItem>
                 {index < Math.min(recentNotifications.length - 1, 4) && <Divider />}
               </React.Fragment>
             ))}
             {(!recentNotifications || recentNotifications.length === 0) && (
               <ListItem>
                 <ListItemText
                   primary="No notifications"
                   secondary="You're all caught up!"
                 />
               </ListItem>
             )}
           </List>
         </Paper>
       )}

      {/* Role-based Dashboard Components */}
      {user?.role === 'ADMIN' && !stats && (
        <Paper sx={{ p: 3, mt: 4, textAlign: 'center' }}>
          <CircularProgress size={40} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading Admin Dashboard...
          </Typography>
        </Paper>
      )}
      
      {user?.role === 'ADMIN' && stats && (
        <>
          <EnhancedAdminDashboard
            stats={{
              totalUsers: stats.totalUsers || 0,
              totalOrders: stats.totalOrders || 0,
              totalDeliveries: stats.totalDeliveries || 0,
              totalRevenue: 12450, // Mock data for now
              activeUsers: stats.totalUsers || 0,
              pendingOrders: stats.pendingOrders || 0,
              completedDeliveries: stats.completedOrders || 0,
            }}
            onRefresh={() => setRefreshKey(prev => prev + 1)}
          />
          <AdminBusinessDashboard
            stats={{
              totalBusinesses: stats.totalBusiness || 0,
              activeBusinesses: stats.totalBusiness || 0, // Mock data for now
              totalDrivers: stats.totalDrivers || 0,
              totalDeliveries: stats.totalDeliveries || 0,
              totalRevenue: 12450, // Mock data for now
              averageRating: 4.6, // Mock data for now
            }}
            onRefresh={() => setRefreshKey(prev => prev + 1)}
          />
        </>
      )}

      {user?.role === 'CUSTOMER' && (
        <CustomerDashboard
          stats={{
            totalOrders: stats?.totalOrders || 0,
            pendingOrders: stats?.pendingOrders || 0,
            completedOrders: stats?.completedOrders || 0,
            totalSpent: 1250, // Mock data for now
            loyaltyPoints: 350, // Mock data for now
          }}
          recentOrders={recentOrders || []}
          onRefresh={() => setRefreshKey(prev => prev + 1)}
        />
      )}

      {user?.role === 'DRIVER' && (
        <DriverDashboard
          stats={{
            totalDeliveries: stats?.totalDeliveries || 0,
            completedDeliveries: stats?.completedOrders || 0,
            pendingDeliveries: stats?.activeDeliveries || 0,
            totalEarnings: 850, // Mock data for now
            rating: 4.7, // Mock data for now
            totalTrips: stats?.totalDeliveries || 0,
          }}
          recentDeliveries={recentDeliveries || []}
          driverProfile={{
            isAvailable: true, // Mock data for now
            vehicleType: 'Car',
            vehicleModel: 'Toyota Camry',
            currentLocation: {
              lat: 40.7128,
              lng: -74.0060,
            },
          }}
          onRefresh={() => setRefreshKey(prev => prev + 1)}
          onToggleAvailability={(available) => {
            // Mock function for now
            console.log('Toggle availability:', available);
          }}
        />
      )}

      {user?.role === 'BUSINESS' && (
        <BusinessDashboard
          stats={{
            totalDrivers: stats?.totalDrivers || 0,
            totalDeliveries: stats?.totalDeliveries || 0,
            totalRevenue: 12450, // Mock data for now
            averageRating: 4.6, // Mock data for now
          }}
          onRefresh={() => setRefreshKey(prev => prev + 1)}
        />
      )}

    </Box>
  );
};

export default DashboardPage;
