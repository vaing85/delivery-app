import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  Payment as PaymentIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { paymentsAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-toastify';
import { getStripeKey, STRIPE_CONFIG } from '../../config/stripe';

// Initialize Stripe
const stripePromise = loadStripe(getStripeKey());

interface PaymentComponentProps {
  orderId?: string;
  amount?: number;
  onPaymentSuccess?: (payment: any) => void;
  onPaymentError?: (error: string) => void;
}

interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  date: string;
  description?: string;
}

// Stripe Card Element options
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

// Payment Form Component
const PaymentForm: React.FC<{
  orderId?: string;
  amount: number;
  onPaymentSuccess?: (payment: any) => void;
  onPaymentError?: (error: string) => void;
}> = ({ orderId, amount, onPaymentSuccess, onPaymentError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [showNewCard, setShowNewCard] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [activeStep, setActiveStep] = useState(0);

  // Load payment methods and history
  useEffect(() => {
    loadPaymentMethods();
    loadPaymentHistory();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const response = await paymentsAPI.getPaymentMethods();
      if (response.success) {
        setPaymentMethods(response.data.paymentMethods || []);
        if (response.data.paymentMethods?.length > 0) {
          setSelectedMethod(response.data.paymentMethods[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const loadPaymentHistory = async () => {
    // Mock payment history for now
    setPaymentHistory([
      {
        id: 'pay_1',
        amount: 25.50,
        currency: 'USD',
        status: 'completed',
        type: 'order_payment',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Order #ORD-001'
      },
      {
        id: 'pay_2',
        amount: 15.75,
        currency: 'USD',
        status: 'completed',
        type: 'order_payment',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Order #ORD-002'
      }
    ]);
  };

  const handlePayment = async () => {
    if (!stripe || !elements) {
      toast.error('Stripe not loaded');
      return;
    }

    setIsProcessing(true);

    try {
      if (showNewCard) {
        // Handle new card payment
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error('Card element not found');
        }

        // Create payment method
        const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
        });

        if (pmError) {
          throw new Error(pmError.message);
        }

        if (!paymentMethod) {
          throw new Error('Failed to create payment method');
        }

        // Create payment intent
        const intentResponse = await paymentsAPI.createPaymentIntent({ orderId: orderId || 'mock-order' });
        
        if (!intentResponse.success) {
          throw new Error(intentResponse.error?.message || 'Failed to create payment intent');
        }

        // Confirm payment
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          intentResponse.data.clientSecret,
          {
            payment_method: paymentMethod.id,
          }
        );

        if (confirmError) {
          throw new Error(confirmError.message);
        }

        if (paymentIntent?.status === 'succeeded') {
          toast.success('Payment successful!');
          onPaymentSuccess?.(paymentIntent);
          setActiveStep(2);
        } else {
          throw new Error('Payment was not successful');
        }
      } else {
        // Handle existing payment method
        if (!selectedMethod) {
          throw new Error('Please select a payment method');
        }

        // Create payment intent
        const intentResponse = await paymentsAPI.createPaymentIntent({ orderId: orderId || 'mock-order' });
        
        if (!intentResponse.success) {
          throw new Error(intentResponse.error?.message || 'Failed to create payment intent');
        }

        // Confirm payment with existing method
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          intentResponse.data.clientSecret,
          {
            payment_method: selectedMethod,
          }
        );

        if (confirmError) {
          throw new Error(confirmError.message);
        }

        if (paymentIntent?.status === 'succeeded') {
          toast.success('Payment successful!');
          onPaymentSuccess?.(paymentIntent);
          setActiveStep(2);
        } else {
          throw new Error('Payment was not successful');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      toast.error(errorMessage);
      onPaymentError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddNewCard = async () => {
    if (!stripe || !elements) {
      toast.error('Stripe not loaded');
      return;
    }

    setIsProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!paymentMethod) {
        throw new Error('Failed to create payment method');
      }

      // Save payment method to backend
      const response = await paymentsAPI.createPaymentMethod({
        card: {
          number: '4242424242424242', // Mock for now
          exp_month: 12,
          exp_year: 2025,
          cvc: '123',
          name: user?.firstName + ' ' + user?.lastName || 'Cardholder'
        }
      });

      if (response.success) {
        toast.success('Payment method added successfully!');
        setShowNewCard(false);
        loadPaymentMethods();
      } else {
        throw new Error(response.error?.message || 'Failed to save payment method');
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add payment method';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const getCardIcon = (brand?: string) => {
    switch (brand) {
      case 'visa': return '💳';
      case 'mastercard': return '💳';
      case 'amex': return '💳';
      default: return '💳';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const steps = [
    'Select Payment Method',
    'Review & Pay',
    'Payment Complete'
  ];

  return (
    <Box>
      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Choose Payment Method
          </Typography>

          {/* Existing Payment Methods */}
          {paymentMethods.length > 0 && (
            <Box mb={3}>
              <Typography variant="subtitle1" gutterBottom>
                Saved Payment Methods
              </Typography>
              {paymentMethods.map((method) => (
                <Card
                  key={method.id}
                  variant="outlined"
                  sx={{
                    mb: 2,
                    cursor: 'pointer',
                    border: selectedMethod === method.id ? 2 : 1,
                    borderColor: selectedMethod === method.id ? 'primary.main' : 'divider'
                  }}
                  onClick={() => {
                    setSelectedMethod(method.id);
                    setShowNewCard(false);
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="center">
                        <Typography variant="h6" sx={{ mr: 1 }}>
                          {getCardIcon(method.card?.brand)}
                        </Typography>
                        <Box>
                          <Typography variant="subtitle1">
                            {method.card?.brand?.toUpperCase()} •••• {method.card?.last4}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Expires {method.card?.exp_month}/{method.card?.exp_year}
                          </Typography>
                        </Box>
                      </Box>
                      {selectedMethod === method.id && (
                        <CheckIcon color="primary" />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {/* Add New Card Option */}
          <Card
            variant="outlined"
            sx={{
              mb: 2,
              cursor: 'pointer',
              border: showNewCard ? 2 : 1,
              borderColor: showNewCard ? 'primary.main' : 'divider'
            }}
            onClick={() => {
              setShowNewCard(true);
              setSelectedMethod('');
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center">
                <AddIcon sx={{ mr: 1 }} />
                <Typography variant="subtitle1">
                  Add New Card
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* New Card Form */}
          {showNewCard && (
            <Box mt={2}>
              <Typography variant="subtitle1" gutterBottom>
                Card Details
              </Typography>
              <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <CardElement options={cardElementOptions} />
              </Box>
              <Box display="flex" gap={1} mt={2}>
                <Button
                  variant="contained"
                  onClick={handleAddNewCard}
                  disabled={isProcessing}
                  startIcon={<AddIcon />}
                >
                  {isProcessing ? 'Adding...' : 'Add Card'}
                </Button>
                <Button
                  onClick={() => setShowNewCard(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          )}

          <Button
            variant="contained"
            size="large"
            onClick={() => setActiveStep(1)}
            disabled={!selectedMethod && !showNewCard}
            fullWidth
            sx={{ mt: 3 }}
          >
            Continue to Review
          </Button>
        </Box>
      )}

      {activeStep === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Review Payment
          </Typography>

          {/* Payment Summary */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h4" color="primary" gutterBottom>
                ${amount.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total amount to be charged
              </Typography>
            </CardContent>
          </Card>

          {/* Selected Payment Method */}
          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom>
              Payment Method
            </Typography>
            {selectedMethod && (
              <Card variant="outlined">
                <CardContent sx={{ p: 2 }}>
                  {(() => {
                    const method = paymentMethods.find(m => m.id === selectedMethod);
                    return method ? (
                      <Box display="flex" alignItems="center">
                        <Typography variant="h6" sx={{ mr: 1 }}>
                          {getCardIcon(method.card?.brand)}
                        </Typography>
                        <Typography variant="subtitle1">
                          {method.card?.brand?.toUpperCase()} •••• {method.card?.last4}
                        </Typography>
                      </Box>
                    ) : null;
                  })()}
                </CardContent>
              </Card>
            )}
            {showNewCard && (
              <Card variant="outlined">
                <CardContent sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center">
                    <Typography variant="h6" sx={{ mr: 1 }}>
                      💳
                    </Typography>
                    <Typography variant="subtitle1">
                      New Card
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>

          {/* Security Notice */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Box display="flex" alignItems="center">
              <SecurityIcon sx={{ mr: 1 }} />
              <Typography variant="body2">
                Your payment information is secure and encrypted. We use Stripe for secure payment processing.
              </Typography>
            </Box>
          </Alert>

          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              onClick={() => setActiveStep(0)}
              fullWidth
            >
              Back
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={handlePayment}
              disabled={isProcessing}
              startIcon={isProcessing ? <CircularProgress size={20} /> : <PaymentIcon />}
              fullWidth
            >
              {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
            </Button>
          </Box>
        </Box>
      )}

      {activeStep === 2 && (
        <Box textAlign="center">
          <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Payment Successful!
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Your payment of ${amount.toFixed(2)} has been processed successfully.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You will receive a confirmation email shortly.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// Main Payment Component
const StripePaymentComponent: React.FC<PaymentComponentProps> = ({
  orderId,
  amount = 0,
  onPaymentSuccess,
  onPaymentError
}) => {
  return (
    <Elements stripe={stripePromise} options={{ appearance: STRIPE_CONFIG.appearance }}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Payment Information
          </Typography>
          <PaymentForm
            orderId={orderId}
            amount={amount}
            onPaymentSuccess={onPaymentSuccess}
            onPaymentError={onPaymentError}
          />
        </CardContent>
      </Card>
    </Elements>
  );
};

export default StripePaymentComponent;
