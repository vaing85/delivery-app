import React from 'react';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Avatar,
  Chip,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  LocalShipping as DeliveryIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationOnIcon,
  Phone as PhoneIcon,
  Star as StarIcon,
  DirectionsCar as CarIcon,
  CameraAlt as CameraIcon,
  Message as MessageIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface CustomerDashboardProps {
  stats: {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalSpent: number;
    loyaltyPoints: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    pickupAddress: string;
    deliveryAddress: string;
    driverName?: string;
    estimatedDelivery?: string;
  }>;
  onRefresh: () => void;
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ 
  stats, 
  recentOrders, 
  onRefresh 
}) => {
  const navigate = useNavigate();

  // Mock data for active delivery
  const activeDelivery = {
    orderNumber: 'ORD-2024-001',
    status: 'IN_TRANSIT',
    driver: {
      name: 'John Smith',
      phone: '+1 (555) 123-4567',
      rating: 4.8,
      vehicle: 'Toyota Camry',
      licensePlate: 'ABC-123',
      photo: null, // Driver photo URL
      isOnline: true
    },
    eta: '2:30 PM',
    deliveryWindow: '2:15 PM - 3:00 PM',
    currentLocation: 'Downtown District',
    progress: 75,
    deliveryPhoto: null, // Photo taken when delivered
    messages: [
      { id: 1, sender: 'driver', message: 'Hi! I\'m on my way with your order. ETA 15 minutes.', timestamp: '2:15 PM' },
      { id: 2, sender: 'customer', message: 'Great! I\'ll be waiting.', timestamp: '2:16 PM' }
    ],
    steps: [
      { label: 'Order Placed', completed: true, time: '10:30 AM' },
      { label: 'Confirmed', completed: true, time: '10:45 AM' },
      { label: 'Assigned to Driver', completed: true, time: '11:00 AM' },
      { label: 'Picked Up', completed: true, time: '11:30 AM' },
      { label: 'In Transit', completed: true, time: '12:00 PM' },
      { label: 'Out for Delivery', completed: false, time: '2:30 PM' },
      { label: 'Delivered', completed: false, time: '3:00 PM' }
    ]
  };

  return (
    <>
      {/* Active Delivery Tracking */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <DeliveryIcon color="primary" sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h5" component="h2">
            Your Order is On the Way!
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Driver Information */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Your Driver
                </Typography>
                <Box display="flex" alignItems="center" mb={2}>
                  <Box position="relative">
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 56, height: 56 }}>
                      {activeDelivery.driver.name.split(' ').map(n => n[0]).join('')}
                    </Avatar>
                    {activeDelivery.driver.isOnline && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 2,
                          right: 18,
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: 'success.main',
                          border: '2px solid white'
                        }}
                      />
                    )}
                  </Box>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6">
                        {activeDelivery.driver.name}
                      </Typography>
                      {activeDelivery.driver.isOnline && (
                        <Chip label="Online" color="success" size="small" />
                      )}
                    </Box>
                    <Box display="flex" alignItems="center">
                      <StarIcon sx={{ color: 'gold', mr: 0.5, fontSize: 16 }} />
                      <Typography variant="body2" color="text.secondary">
                        {activeDelivery.driver.rating} (127 reviews)
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box display="flex" alignItems="center" mb={1}>
                  <PhoneIcon sx={{ mr: 1, fontSize: 16 }} />
                  <Typography variant="body2">
                    {activeDelivery.driver.phone}
                  </Typography>
                </Box>
                
                <Box display="flex" alignItems="center" mb={1}>
                  <CarIcon sx={{ mr: 1, fontSize: 16 }} />
                  <Typography variant="body2">
                    {activeDelivery.driver.vehicle}
                  </Typography>
                </Box>
                
                <Box display="flex" alignItems="center">
                  <LocationOnIcon sx={{ mr: 1, fontSize: 16 }} />
                  <Typography variant="body2">
                    {activeDelivery.driver.licensePlate}
                  </Typography>
                </Box>

                <Button 
                  variant="contained" 
                  fullWidth 
                  sx={{ mt: 2 }}
                  onClick={() => window.open(`tel:${activeDelivery.driver.phone}`)}
                >
                  Call Driver
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* ETA and Progress */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Delivery Window
                </Typography>
                
                <Box textAlign="center" mb={3}>
                  <Typography variant="h2" color="primary.main" gutterBottom>
                    {activeDelivery.eta}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Today, January 15, 2024
                  </Typography>
                  <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                    <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {activeDelivery.deliveryWindow}
                    </Typography>
                  </Box>
                  <Chip 
                    label="On Time" 
                    color="success" 
                    size="small" 
                    sx={{ mt: 1 }}
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Delivery Progress
                </Typography>
                <Box display="flex" alignItems="center" mb={1}>
                  <Box flex={1} mr={1}>
                    <LinearProgress 
                      variant="determinate" 
                      value={activeDelivery.progress} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {activeDelivery.progress}%
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  Current location: {activeDelivery.currentLocation}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Order Details */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Order Details
                </Typography>
                
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Order Number
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {activeDelivery.orderNumber}
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip 
                    label={activeDelivery.status.replace('_', ' ')} 
                    color="primary" 
                    size="small"
                  />
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Items
                  </Typography>
                  <Typography variant="body1">
                    3 items • Electronics
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Total Amount
                  </Typography>
                  <Typography variant="h6" color="primary.main">
                    $89.99
                  </Typography>
                </Box>

                {/* Photo Confirmation */}
                {activeDelivery.deliveryPhoto ? (
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Delivery Photo
                    </Typography>
                    <Box
                      sx={{
                        width: '100%',
                        height: 120,
                        backgroundColor: 'grey.100',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px dashed',
                        borderColor: 'grey.300'
                      }}
                    >
                      <Box textAlign="center">
                        <CameraIcon sx={{ fontSize: 32, color: 'grey.400', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Photo taken at delivery
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Delivery Photo
                    </Typography>
                    <Box
                      sx={{
                        width: '100%',
                        height: 80,
                        backgroundColor: 'grey.50',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid',
                        borderColor: 'grey.200'
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Photo will appear when delivered
                      </Typography>
                    </Box>
                  </Box>
                )}

                <Button 
                  variant="outlined" 
                  fullWidth 
                  onClick={() => navigate('/orders')}
                >
                  View Order Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* In-App Messaging */}
      <Paper sx={{ p: 3, mt: 3 }} data-messaging-section>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <MessageIcon color="primary" />
          <Typography variant="h6">
            Chat with Driver
          </Typography>
        </Box>
        
        <Box
          sx={{
            maxHeight: 200,
            overflowY: 'auto',
            border: '1px solid',
            borderColor: 'grey.200',
            borderRadius: 1,
            p: 2,
            mb: 2,
            backgroundColor: 'grey.50'
          }}
        >
          {activeDelivery.messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                mb: 2,
                display: 'flex',
                justifyContent: message.sender === 'customer' ? 'flex-end' : 'flex-start'
              }}
            >
              <Box
                sx={{
                  maxWidth: '70%',
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: message.sender === 'customer' ? 'primary.main' : 'white',
                  color: message.sender === 'customer' ? 'white' : 'text.primary',
                  border: message.sender === 'driver' ? '1px solid' : 'none',
                  borderColor: 'grey.200'
                }}
              >
                <Typography variant="body2">
                  {message.message}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: message.sender === 'customer' ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                    fontSize: '0.7rem'
                  }}
                >
                  {message.timestamp}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
        
        <Box display="flex" gap={1}>
          <Box flex={1}>
            <input
              type="text"
              placeholder="Type a message..."
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </Box>
          <Button variant="contained" size="small">
            Send
          </Button>
        </Box>
      </Paper>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="outlined" 
              fullWidth 
              startIcon={<PhoneIcon />}
              onClick={() => window.open(`tel:${activeDelivery.driver.phone}`)}
            >
              Call Driver
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="outlined" 
              fullWidth 
              startIcon={<MessageIcon />}
              onClick={() => {
                // Scroll to messaging section
                const messagingSection = document.querySelector('[data-messaging-section]');
                messagingSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Message Driver
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="outlined" 
              fullWidth 
              startIcon={<LocationOnIcon />}
              onClick={() => navigate('/orders')}
            >
              Track on Map
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="outlined" 
              fullWidth 
              startIcon={<DeliveryIcon />}
              onClick={() => navigate('/orders')}
            >
              View All Orders
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </>
  );
};

export default CustomerDashboard;
