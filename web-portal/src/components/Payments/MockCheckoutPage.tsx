import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Payment as PaymentIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  Smartphone as MobileIcon
} from '@mui/icons-material';

interface MockCheckoutPageProps {
  checkoutId: string;
  amount: number;
  currency: string;
  onPaymentComplete: (result: any) => void;
  onPaymentCancel: () => void;
}

const MockCheckoutPage: React.FC<MockCheckoutPageProps> = ({
  checkoutId,
  amount,
  currency,
  onPaymentComplete,
  onPaymentCancel
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const steps = ['Select Payment Method', 'Process Payment', 'Complete'];

  const paymentMethods = [
    {
      id: 'mock_card_visa',
      name: 'Visa Card',
      icon: <CreditCardIcon />,
      description: 'Pay with Visa credit or debit card',
      color: '#1A1F71'
    },
    {
      id: 'mock_card_mastercard',
      name: 'Mastercard',
      icon: <CreditCardIcon />,
      description: 'Pay with Mastercard credit or debit card',
      color: '#EB001B'
    },
    {
      id: 'mock_paypal',
      name: 'PayPal',
      icon: <PaymentIcon />,
      description: 'Pay with your PayPal account',
      color: '#0070BA'
    },
    {
      id: 'mock_bank_transfer',
      name: 'Bank Transfer',
      icon: <BankIcon />,
      description: 'Direct bank transfer',
      color: '#28A745'
    },
    {
      id: 'mock_apple_pay',
      name: 'Apple Pay',
      icon: <MobileIcon />,
      description: 'Pay with Apple Pay',
      color: '#000000'
    }
  ];

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setCurrentStep(1);
  };

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Simulate different outcomes
    const random = Math.random();
    let result;
    
    if (random < 0.8) {
      result = {
        success: true,
        paymentId: `mock_payment_${Date.now()}`,
        status: 'completed',
        message: 'Payment completed successfully!'
      };
    } else if (random < 0.95) {
      result = {
        success: true,
        paymentId: `mock_payment_${Date.now()}`,
        status: 'pending',
        message: 'Payment is being processed...'
      };
    } else {
      result = {
        success: false,
        paymentId: `mock_payment_${Date.now()}`,
        status: 'failed',
        message: 'Payment failed - insufficient funds'
      };
    }
    
    setPaymentResult(result);
    setCurrentStep(2);
    setIsProcessing(false);
    
    // Auto-complete after showing result
    setTimeout(() => {
      onPaymentComplete(result);
    }, 2000);
  };

  const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod);

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Card>
        <CardContent>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              🎭 Mock Payment Checkout
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This is a mock payment system for development
            </Typography>
            <Chip 
              label="Rapyd Account Inactive" 
              color="warning" 
              size="small" 
              sx={{ mt: 1 }}
            />
          </Box>

          {/* Stepper */}
          <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step 1: Select Payment Method */}
          {currentStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Select Payment Method
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Amount: {currency} {amount.toFixed(2)}
              </Typography>
              
              <Box sx={{ display: 'grid', gap: 2 }}>
                {paymentMethods.map((method) => (
                  <Card
                    key={method.id}
                    sx={{
                      cursor: 'pointer',
                      border: selectedMethod === method.id ? 2 : 1,
                      borderColor: selectedMethod === method.id ? 'primary.main' : 'divider',
                      '&:hover': { borderColor: 'primary.main' }
                    }}
                    onClick={() => handleMethodSelect(method.id)}
                  >
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ color: method.color }}>
                        {method.icon}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6">{method.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {method.description}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          )}

          {/* Step 2: Process Payment */}
          {currentStep === 1 && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Ready to Process Payment
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Using {selectedMethodData?.name}
              </Typography>
              
              {isProcessing && (
                <Box>
                  <CircularProgress size={60} sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Processing your payment...
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Step 3: Complete */}
          {currentStep === 2 && paymentResult && (
            <Box sx={{ textAlign: 'center' }}>
              {paymentResult.success ? (
                <Box>
                  <CheckCircleIcon 
                    sx={{ fontSize: 60, color: 'success.main', mb: 2 }} 
                  />
                  <Typography variant="h6" color="success.main" gutterBottom>
                    {paymentResult.status === 'completed' ? 'Payment Successful!' : 'Payment Pending'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {paymentResult.message}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Payment ID: {paymentResult.paymentId}
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Typography variant="h6" color="error.main" gutterBottom>
                    Payment Failed
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {paymentResult.message}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            {currentStep < 2 && (
              <Button
                variant="outlined"
                onClick={onPaymentCancel}
                disabled={isProcessing}
              >
                Cancel
              </Button>
            )}
            {currentStep === 1 && !isProcessing && (
              <Button
                variant="contained"
                size="large"
                onClick={handleProcessPayment}
                startIcon={<PaymentIcon />}
              >
                Process Payment
              </Button>
            )}
            {currentStep === 2 && paymentResult?.success && (
              <Button
                variant="contained"
                onClick={() => onPaymentComplete(paymentResult)}
                startIcon={<CheckCircleIcon />}
              >
                Complete Order
              </Button>
            )}
          </Box>

          {/* Development Notice */}
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Development Mode:</strong> This is a mock payment system. 
              No real money will be charged. To enable real payments, activate your Rapyd account.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MockCheckoutPage;
