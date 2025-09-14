import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Payment as PaymentIcon,
  CreditCard as CreditCardIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { paymentsAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import MockCheckoutPage from './MockCheckoutPage';

interface RapydPaymentComponentProps {
  orderId?: string;
  amount?: number;
  currency?: string;
  onPaymentSuccess?: (paymentData: any) => void;
  onPaymentError?: (error: string) => void;
}

interface PaymentMethod {
  id: string;
  type: string;
  category: string;
  image: string;
  name: string;
  country: string;
  currencies: string[];
}

interface CheckoutPage {
  id: string;
  amount: number;
  currency: string;
  merchant_reference_id: string;
  redirect_url: string;
  complete_payment_url: string;
  cancel_payment_url: string;
  status: string;
  created_at: number;
  expires_at: number;
}

const RapydPaymentComponent: React.FC<RapydPaymentComponentProps> = ({
  orderId,
  amount = 0,
  currency = 'USD',
  onPaymentSuccess,
  onPaymentError
}) => {
  const { user } = useAuthStore();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('US');
  const [isMockMode, setIsMockMode] = useState(false);
  
  // Checkout page
  const [checkoutPage, setCheckoutPage] = useState<CheckoutPage | null>(null);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [showMockCheckout, setShowMockCheckout] = useState(false);
  
  // Form data
  const [customerData, setCustomerData] = useState({
    email: user?.email || '',
    name: user ? `${user.firstName} ${user.lastName}` : '',
    phone_number: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      country: 'US',
      zip: ''
    }
  });

  const steps = [
    'Select Payment Method',
    'Enter Customer Details',
    'Create Checkout Page',
    'Complete Payment'
  ];

  // Load payment methods on component mount
  useEffect(() => {
    loadPaymentMethods();
  }, [selectedCountry, currency]);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await paymentsAPI.getPaymentMethods(selectedCountry, currency);
      setPaymentMethods(response.data);
      
      // Check if we're in mock mode
      if ((response as any).mock) {
        setIsMockMode(true);
        console.log('🎭 Payment system is in mock mode - Rapyd account inactive');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setError(null);
    setSuccess(null);
    setCheckoutPage(null);
  };

  const handleCreateCheckout = async () => {
    if (!orderId) {
      setError('Order ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isMockMode) {
        // Use mock checkout
        setShowMockCheckout(true);
        handleNext();
        return;
      }

      // Create customer if needed
      await paymentsAPI.createCustomer(customerData);

      // Create checkout page
      const response = await paymentsAPI.createCheckoutPage({
        orderId,
        amount,
        currency,
        redirect_url: `${window.location.origin}/orders/${orderId}`,
        complete_payment_url: `${window.location.origin}/orders/${orderId}?payment=success`,
        cancel_payment_url: `${window.location.origin}/orders/${orderId}?payment=cancelled`,
        description: `Payment for order ${orderId}`
      });

      setCheckoutPage(response.data);
      setShowCheckoutDialog(true);
      handleNext();
    } catch (err: any) {
      setError(err.message || 'Failed to create checkout page');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentComplete = (paymentResult?: any) => {
    setSuccess('Payment completed successfully!');
    // Pass the payment result with proper structure
    const result = paymentResult || {
      paymentId: checkoutPage?.id || `payment_${Date.now()}`,
      status: 'completed',
      success: true
    };
    onPaymentSuccess?.(result);
    handleNext();
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    onPaymentError?.(errorMessage);
  };

  const renderPaymentMethods = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select Payment Method
      </Typography>
      <FormControl fullWidth margin="normal">
        <InputLabel>Country</InputLabel>
        <Select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
        >
          <MenuItem value="US">United States</MenuItem>
          <MenuItem value="CA">Canada</MenuItem>
          <MenuItem value="GB">United Kingdom</MenuItem>
          <MenuItem value="DE">Germany</MenuItem>
          <MenuItem value="FR">France</MenuItem>
          <MenuItem value="ES">Spain</MenuItem>
          <MenuItem value="IT">Italy</MenuItem>
          <MenuItem value="AU">Australia</MenuItem>
        </Select>
      </FormControl>
      
      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {paymentMethods.map((method) => (
            <Grid item xs={12} sm={6} md={4} key={method.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: selectedMethod === method.id ? 2 : 1,
                  borderColor: selectedMethod === method.id ? 'primary.main' : 'divider',
                  '&:hover': { borderColor: 'primary.main' }
                }}
                onClick={() => setSelectedMethod(method.id)}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <img
                      src={method.image}
                      alt={method.name}
                      style={{ width: 40, height: 40, objectFit: 'contain' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-payment.png';
                      }}
                    />
                    <Box>
                      <Typography variant="subtitle1">{method.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {method.category}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  const renderCustomerDetails = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Customer Information
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={customerData.email}
            onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Full Name"
            value={customerData.name}
            onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone Number"
            value={customerData.phone_number}
            onChange={(e) => setCustomerData({ ...customerData, phone_number: e.target.value })}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Address (Optional)
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Address Line 1"
            value={customerData.address.line1}
            onChange={(e) => setCustomerData({
              ...customerData,
              address: { ...customerData.address, line1: e.target.value }
            })}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Address Line 2"
            value={customerData.address.line2}
            onChange={(e) => setCustomerData({
              ...customerData,
              address: { ...customerData.address, line2: e.target.value }
            })}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="City"
            value={customerData.address.city}
            onChange={(e) => setCustomerData({
              ...customerData,
              address: { ...customerData.address, city: e.target.value }
            })}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="State"
            value={customerData.address.state}
            onChange={(e) => setCustomerData({
              ...customerData,
              address: { ...customerData.address, state: e.target.value }
            })}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="ZIP Code"
            value={customerData.address.zip}
            onChange={(e) => setCustomerData({
              ...customerData,
              address: { ...customerData.address, zip: e.target.value }
            })}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderCheckoutPage = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Payment Summary
      </Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Total Amount</Typography>
            <Typography variant="h6" color="primary">
              {currency} {amount.toFixed(2)}
            </Typography>
          </Box>
          <Divider />
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Order ID: {orderId}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Payment Method: {paymentMethods.find(m => m.id === selectedMethod)?.name || 'Selected'}
            </Typography>
          </Box>
        </CardContent>
      </Card>
      
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          Click "Create Checkout Page" to proceed with payment. You will be redirected to a secure payment page.
        </Typography>
      </Alert>
    </Box>
  );

  const renderPaymentComplete = () => (
    <Box textAlign="center">
      <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        Payment Successful!
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Your payment has been processed successfully. You will receive a confirmation email shortly.
      </Typography>
      {checkoutPage && (
        <Box mt={2}>
          <Chip
            label={`Transaction ID: ${checkoutPage.id}`}
            variant="outlined"
            color="primary"
          />
        </Box>
      )}
    </Box>
  );

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={3}>
            <PaymentIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h5">Rapyd Payment</Typography>
            {isMockMode && (
              <Chip 
                label="Mock Mode" 
                color="warning" 
                size="small" 
                sx={{ ml: 2 }}
              />
            )}
          </Box>

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

          <Stepper activeStep={activeStep} orientation="vertical">
            <Step>
              <StepLabel>Select Payment Method</StepLabel>
              <StepContent>
                {renderPaymentMethods()}
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!selectedMethod}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Continue
                  </Button>
                </Box>
              </StepContent>
            </Step>

            <Step>
              <StepLabel>Enter Customer Details</StepLabel>
              <StepContent>
                {renderCustomerDetails()}
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!customerData.email || !customerData.name}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Continue
                  </Button>
                  <Button onClick={handleBack} sx={{ mt: 1, mr: 1 }}>
                    Back
                  </Button>
                </Box>
              </StepContent>
            </Step>

            <Step>
              <StepLabel>Create Checkout Page</StepLabel>
              <StepContent>
                {renderCheckoutPage()}
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleCreateCheckout}
                    disabled={loading}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    {loading ? <CircularProgress size={20} /> : 'Create Checkout Page'}
                  </Button>
                  <Button onClick={handleBack} sx={{ mt: 1, mr: 1 }}>
                    Back
                  </Button>
                </Box>
              </StepContent>
            </Step>

            <Step>
              <StepLabel>Complete Payment</StepLabel>
              <StepContent>
                {renderPaymentComplete()}
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleReset}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Make Another Payment
                  </Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </CardContent>
      </Card>

      {/* Checkout Dialog */}
      <Dialog
        open={showCheckoutDialog}
        onClose={() => setShowCheckoutDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Complete Payment</DialogTitle>
        <DialogContent>
          {checkoutPage && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                You will be redirected to a secure payment page to complete your transaction.
              </Alert>
              <Box textAlign="center" py={3}>
                <Typography variant="h6" gutterBottom>
                  Amount: {currency} {amount.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click the button below to proceed to payment
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCheckoutDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (checkoutPage) {
                window.open(checkoutPage.redirect_url, '_blank');
                handlePaymentComplete();
              }
            }}
          >
            Proceed to Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mock Checkout Dialog */}
      <Dialog
        open={showMockCheckout}
        onClose={() => setShowMockCheckout(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Mock Payment Checkout</DialogTitle>
        <DialogContent>
          <MockCheckoutPage
            checkoutId={`mock_checkout_${Date.now()}`}
            amount={amount}
            currency={currency}
            onPaymentComplete={(result) => {
              setShowMockCheckout(false);
              handlePaymentComplete(result);
            }}
            onPaymentCancel={() => setShowMockCheckout(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default RapydPaymentComponent;
