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
  Tooltip
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
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { paymentsAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

interface PaymentComponentProps {
  orderId?: string;
  amount?: number;
  onPaymentSuccess?: (payment: any) => void;
  onPaymentError?: (error: string) => void;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'wallet';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
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

const PaymentComponent: React.FC<PaymentComponentProps> = ({
  orderId,
  amount = 0,
  onPaymentSuccess,
  onPaymentError
}) => {
  const { user } = useAuthStore();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    name: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Mock payment methods for development
  useEffect(() => {
    setPaymentMethods([
      {
        id: 'pm_1',
        type: 'card',
        last4: '4242',
        brand: 'visa',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true
      },
      {
        id: 'pm_2',
        type: 'card',
        last4: '5555',
        brand: 'mastercard',
        expiryMonth: 8,
        expiryYear: 2026,
        isDefault: false
      }
    ]);
    setSelectedMethod('pm_1');
  }, []);

  // Mock payment history
  useEffect(() => {
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
  }, []);

  const handlePayment = async () => {
    if (!selectedMethod && !showCardForm) {
      setSnackbar({
        open: true,
        message: 'Please select a payment method or add a new card.',
        severity: 'warning'
      });
      return;
    }

    setIsProcessing(true);

    try {
      let paymentMethodId = selectedMethod;

      // If adding new card, create payment method first
      if (showCardForm) {
        const newMethodResponse = await paymentsAPI.createPaymentMethod({
          card: {
            number: cardDetails.number,
            exp_month: parseInt(cardDetails.expiryMonth),
            exp_year: parseInt(cardDetails.expiryYear),
            cvc: cardDetails.cvv,
            name: cardDetails.name
          }
        });

        if (newMethodResponse.success) {
          paymentMethodId = newMethodResponse.data.paymentMethodId;
        } else {
          throw new Error('Failed to create payment method');
        }
      }

      // Process payment
      const paymentResponse = await paymentsAPI.processPayment({
        orderId: orderId || 'mock-order',
        amount,
        paymentMethodId
      });

      if (paymentResponse.success) {
        setSnackbar({
          open: true,
          message: 'Payment processed successfully!',
          severity: 'success'
        });
        onPaymentSuccess?.(paymentResponse.data);
      } else {
        throw new Error(paymentResponse.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
      onPaymentError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddCard = () => {
    setShowCardForm(true);
    setSelectedMethod('');
  };

  const handleCancelAddCard = () => {
    setShowCardForm(false);
    setCardDetails({
      number: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      name: ''
    });
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
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

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Payment Information
          </Typography>

          {/* Payment Amount */}
          <Box mb={3}>
            <Typography variant="h4" color="primary" gutterBottom>
              ${amount.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total amount to be charged
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Payment Methods */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Payment Methods
            </Typography>

            {!showCardForm ? (
              <Box>
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
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center">
                          <Typography variant="h6" sx={{ mr: 1 }}>
                            {getCardIcon(method.brand)}
                          </Typography>
                          <Box>
                            <Typography variant="subtitle1">
                              {method.brand?.toUpperCase()} •••• {method.last4}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Expires {method.expiryMonth}/{method.expiryYear}
                            </Typography>
                          </Box>
                        </Box>
                        {method.isDefault && (
                          <Chip label="Default" size="small" color="primary" />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}

                <Button
                  variant="outlined"
                  startIcon={<CreditCardIcon />}
                  onClick={handleAddCard}
                  fullWidth
                >
                  Add New Card
                </Button>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Add New Card
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Card Number"
                      value={cardDetails.number}
                      onChange={(e) => setCardDetails(prev => ({
                        ...prev,
                        number: formatCardNumber(e.target.value)
                      }))}
                      placeholder="1234 5678 9012 3456"
                      inputProps={{ maxLength: 19 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Cardholder Name"
                      value={cardDetails.name}
                      onChange={(e) => setCardDetails(prev => ({
                        ...prev,
                        name: e.target.value
                      }))}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Expiry Month</InputLabel>
                      <Select
                        value={cardDetails.expiryMonth}
                        onChange={(e) => setCardDetails(prev => ({
                          ...prev,
                          expiryMonth: e.target.value
                        }))}
                        label="Expiry Month"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <MenuItem key={i + 1} value={String(i + 1).padStart(2, '0')}>
                            {String(i + 1).padStart(2, '0')}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Expiry Year</InputLabel>
                      <Select
                        value={cardDetails.expiryYear}
                        onChange={(e) => setCardDetails(prev => ({
                          ...prev,
                          expiryYear: e.target.value
                        }))}
                        label="Expiry Year"
                      >
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = new Date().getFullYear() + i;
                          return (
                            <MenuItem key={year} value={String(year)}>
                              {year}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="CVV"
                      value={cardDetails.cvv}
                      onChange={(e) => setCardDetails(prev => ({
                        ...prev,
                        cvv: e.target.value.replace(/\D/g, '').slice(0, 4)
                      }))}
                      placeholder="123"
                      inputProps={{ maxLength: 4 }}
                    />
                  </Grid>
                </Grid>
                <Box display="flex" gap={1} mt={2}>
                  <Button onClick={handleCancelAddCard}>
                    Cancel
                  </Button>
                </Box>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Payment History */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Recent Payments
            </Typography>
            <List>
              {paymentHistory.slice(0, 3).map((payment) => (
                <ListItem key={payment.id} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <PaymentIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`$${payment.amount.toFixed(2)} - ${payment.description || 'Payment'}`}
                    secondary={new Date(payment.date).toLocaleDateString()}
                  />
                  <Chip
                    label={payment.status}
                    color={getStatusColor(payment.status) as any}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Process Payment Button */}
          <Button
            variant="contained"
            size="large"
            startIcon={<PaymentIcon />}
            onClick={handlePayment}
            disabled={isProcessing || (!selectedMethod && !showCardForm)}
            fullWidth
          >
            {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
          </Button>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Your payment information is secure and encrypted. We use industry-standard security measures to protect your data.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default PaymentComponent;
