import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { ordersAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import StripePaymentComponent from '../../components/Payments/StripePaymentComponent';

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { isAuthenticated, user } = useAuthStore();
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Fetch order details
  const { data: orderData, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID is required');
      const response = await ordersAPI.getOrder(orderId);
      return response.data;
    },
    enabled: !!orderId && isAuthenticated
  });

  const handlePaymentSuccess = (payment: any) => {
    console.log('Payment successful:', payment);
    setPaymentSuccess(true);
    
    // Redirect to order details after 3 seconds
    setTimeout(() => {
      navigate(`/orders/${orderId}`);
    }, 3000);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
  };

  if (!isAuthenticated) {
    return (
      <Box p={3}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={40} />
        </Box>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box p={3}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={40} />
        </Box>
      </Box>
    );
  }

  if (error || !orderData) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load order details. Please try again.
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/orders')}
          sx={{ mt: 2 }}
        >
          Back to Orders
        </Button>
      </Box>
    );
  }

  const order = orderData;

  if (paymentSuccess) {
    return (
      <Box p={3}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Payment Successful!
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Your payment for order #{order.orderNumber} has been processed successfully.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Redirecting to order details...
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate(`/orders/${orderId}`)}
          >
            View Order Details
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/orders/${orderId}`)}
          sx={{ mr: 2 }}
        >
          Back to Order
        </Button>
        <Typography variant="h4" component="h1">
          Payment
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Order Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box mb={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Order Number
                </Typography>
                <Typography variant="body1">
                  #{order.orderNumber}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Pickup Address
                </Typography>
                <Typography variant="body2">
                  {order.pickupAddress}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Delivery Address
                </Typography>
                <Typography variant="body2">
                  {order.deliveryAddress}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Order Items */}
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Items ({order.items?.length || 0})
              </Typography>
              {order.items?.map((item: any, index: number) => (
                <Box key={index} display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">
                    {item.quantity}x {item.name}
                  </Typography>
                  <Typography variant="body2">
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </Typography>
                </Box>
              ))}

              <Divider sx={{ my: 2 }} />

              {/* Total */}
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  Total
                </Typography>
                <Typography variant="h6" color="primary">
                  ${order.total?.toFixed(2) || '0.00'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Form */}
        <Grid item xs={12} md={8}>
          <StripePaymentComponent
            orderId={orderId}
            amount={order.total || 0}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default PaymentPage;

