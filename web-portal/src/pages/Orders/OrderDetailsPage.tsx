import React from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon,
  LocationOn as LocationIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import GoogleTrackingMap from '@/components/Tracking/GoogleTrackingMap-simple';
import ErrorBoundary from '@/components/ErrorBoundary';
import GoogleMapsDebugger from '@/components/Debug/GoogleMapsDebugger';
import { useAuthStore } from '@/store/authStore';
import { CircularProgress } from '@mui/material';

const OrderDetailsPage: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  // Mock order data
  const order = {
    id: orderId,
    orderNumber: 'ORD-001',
    customer: 'John Doe',
    email: 'john.doe@email.com',
    phone: '+1-555-0123',
    status: 'pending',
    paymentStatus: 'PENDING',
    total: 45.99,
    createdAt: '2024-01-15 10:30 AM',
    items: [
      { name: 'Product 1', quantity: 2, price: 15.99, total: 31.98 },
      { name: 'Product 2', quantity: 1, price: 14.01, total: 14.01 }
    ],
    shippingAddress: '123 Main St, City, State 12345',
    billingAddress: '123 Main St, City, State 12345'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

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

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/orders')}
          >
            Back to Orders
          </Button>
          <Typography variant="h4" component="h1">
            Order Details
          </Typography>
        </Box>
        
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            Print Order
          </Button>
          {order.paymentStatus === 'PENDING' && user?.role === 'CUSTOMER' && (
            <Button
              variant="contained"
              startIcon={<PaymentIcon />}
              onClick={() => navigate(`/orders/${orderId}/payment`)}
            >
              Pay Now
            </Button>
          )}
        </Box>
      </Box>

      {/* Customer-specific Delivery Tracking */}
      {user?.role === 'CUSTOMER' && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Delivery Tracking
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <LocationIcon color="primary" />
                <Box>
                  <Typography variant="subtitle1">
                    Current Status: {order.status}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last updated: {order.createdAt}
                  </Typography>
                </Box>
              </Box>
              
              {/* Delivery Progress Steps */}
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Delivery Progress
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  {['Order Placed', 'Confirmed', 'Assigned to Driver', 'Picked Up', 'In Transit', 'Delivered'].map((step, index) => (
                    <Box key={step} display="flex" alignItems="center" gap={2}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          backgroundColor: index <= 1 ? 'primary.main' : 'grey.300',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '12px'
                        }}
                      >
                        {index <= 1 ? '✓' : index + 1}
                      </Box>
                      <Typography
                        variant="body2"
                        color={index <= 1 ? 'text.primary' : 'text.secondary'}
                      >
                        {step}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              {/* Driver Information */}
              <Box mb={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Driver Information
                </Typography>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          backgroundColor: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '18px'
                        }}
                      >
                        JD
                      </Box>
                      <Box>
                        <Typography variant="subtitle1">
                          John Driver
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Vehicle: Toyota Camry (ABC-123)
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Rating: ⭐⭐⭐⭐⭐ (4.8)
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>

              {/* Estimated Delivery */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Estimated Delivery
                </Typography>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      2:30 PM - 3:30 PM
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Today, January 15, 2024
                    </Typography>
                    <Box mt={1}>
                      <Chip label="On Time" color="success" size="small" />
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      <Grid container spacing={3}>
        {/* Order Summary */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Order Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Order Number
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {order.orderNumber}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Chip 
                  label={order.status.replace('_', ' ')} 
                  color={getStatusColor(order.status) as any}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Customer
                </Typography>
                <Typography variant="body1">
                  {order.customer}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Total
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  ${order.total}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body1">
                  {order.createdAt}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">
                  {order.email}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Order Items */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Order Items
            </Typography>
            <List>
              {order.items.map((item, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText
                      primary={item.name}
                      secondary={`Quantity: ${item.quantity} × $${item.price}`}
                    />
                    <Typography variant="body1" fontWeight="bold">
                      ${item.total}
                    </Typography>
                  </ListItem>
                  {index < order.items.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>

          {/* Order Tracking */}
           <Paper sx={{ p: 3 }}>
             <Box display="flex" alignItems="center" gap={1} mb={2}>
               <LocationIcon color="primary" />
               <Typography variant="h6">
                 Order Tracking
               </Typography>
             </Box>
             <ErrorBoundary>
               <GoogleTrackingMap orderId={orderId || 'order-1'} />
             </ErrorBoundary>
           </Paper>
        </Grid>

        {/* Customer & Address Info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Customer Information
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Name
            </Typography>
            <Typography variant="body1" gutterBottom>
              {order.customer}
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              Email
            </Typography>
            <Typography variant="body1" gutterBottom>
              {order.email}
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              Phone
            </Typography>
            <Typography variant="body1">
              {order.phone}
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Shipping Address
            </Typography>
            <Typography variant="body2">
              {order.shippingAddress}
            </Typography>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Billing Address
            </Typography>
            <Typography variant="body2">
              {order.billingAddress}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Debug Component - Remove this after fixing the issue */}
      <GoogleMapsDebugger />
    </Box>
  );
};

export default OrderDetailsPage;
