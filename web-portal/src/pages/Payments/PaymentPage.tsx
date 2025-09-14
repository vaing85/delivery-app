import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import RapydPaymentComponent from '../../components/Payments/RapydPaymentComponent';
import { ordersAPI, paymentsAPI } from '../../services/api';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  currency: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

const PaymentPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentStatus = searchParams.get('payment');
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  useEffect(() => {
    if (paymentStatus === 'success') {
      // Handle successful payment
      console.log('Payment successful');
    } else if (paymentStatus === 'cancelled') {
      // Handle cancelled payment
      console.log('Payment cancelled');
    }
  }, [paymentStatus]);

  const loadOrder = async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      const response = await ordersAPI.getOrder(orderId);
      setOrder(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    console.log('Payment successful:', paymentData);
    
    try {
      // Update order status in database using payment completion endpoint
      if (orderId && paymentData?.paymentId) {
        await paymentsAPI.completePayment({
          orderId,
          paymentId: paymentData.paymentId,
          status: paymentData.status || 'completed',
          amount: order?.total || 0
        });
        
        // Reload order to get updated data
        await loadOrder();
      }
      
      // Redirect to order details or show success message
      navigate(`/orders/${orderId}?payment=success`);
    } catch (error) {
      console.error('Error updating order status:', error);
      // Still redirect even if update fails
      navigate(`/orders/${orderId}?payment=success`);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    console.error('Payment error:', errorMessage);
    setError(errorMessage);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/orders/${orderId}`)}
        >
          Back to Order
        </Button>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Order not found
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/orders')}
        >
          Back to Orders
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          color="inherit"
          href="/orders"
          onClick={(e) => {
            e.preventDefault();
            navigate('/orders');
          }}
        >
          Orders
        </Link>
        <Link
          color="inherit"
          href={`/orders/${orderId}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/orders/${orderId}`);
          }}
        >
          Order {order.orderNumber}
        </Link>
        <Typography color="text.primary">Payment</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/orders/${orderId}`)}
          sx={{ mr: 2 }}
        >
          Back to Order
        </Button>
        <PaymentIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h4" component="h1">
          Payment
        </Typography>
      </Box>

      {/* Order Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Order Summary
          </Typography>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="body1">
              Order #{order.orderNumber}
            </Typography>
            <Typography variant="h6" color="primary">
              {order.currency} {order.total.toFixed(2)}
            </Typography>
          </Box>
          
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary">
              Customer: {order.customer.firstName} {order.customer.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Email: {order.customer.email}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Items ({order.items.length}):
            </Typography>
            {order.items.map((item, index) => (
              <Box key={index} display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">
                  {item.name} x {item.quantity}
                </Typography>
                <Typography variant="body2">
                  {order.currency} {item.totalPrice.toFixed(2)}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Payment Status Messages */}
      {paymentStatus === 'success' && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Payment completed successfully! Your order has been confirmed.
        </Alert>
      )}

      {paymentStatus === 'cancelled' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Payment was cancelled. You can try again or contact support if you need assistance.
        </Alert>
      )}

      {/* Payment Component */}
      {order.paymentStatus !== 'COMPLETED' && (
        <RapydPaymentComponent
          orderId={order.id}
          amount={order.total}
          currency={order.currency}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
      )}

      {order.paymentStatus === 'COMPLETED' && (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="success.main" gutterBottom>
                Payment Already Completed
              </Typography>
              <Typography variant="body1" color="text.secondary">
                This order has already been paid for.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default PaymentPage;
