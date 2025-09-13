import React from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Map as MapIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  LocalShipping as DeliveryIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { CircularProgress } from '@mui/material';

const DeliveryDetailsPage: React.FC = () => {
  const { deliveryId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Mock delivery data
  const delivery = {
    id: deliveryId,
    orderNumber: 'ORD-001',
    customer: 'John Doe',
    driver: 'Mike Johnson',
    status: 'in_transit',
    pickupAddress: '123 Main St, City, State 12345',
    deliveryAddress: '456 Oak Ave, Town, State 12345',
    estimatedPickup: '2024-01-15 10:00 AM',
    estimatedDelivery: '2024-01-15 14:00 PM',
    actualPickup: '2024-01-15 10:15 AM',
    actualDelivery: null,
    phone: '+1-555-0123',
    email: 'john.doe@email.com',
    notes: 'Fragile items - handle with care',
    timeline: [
      { time: '2024-01-15 09:00 AM', event: 'Order confirmed', status: 'completed' },
      { time: '2024-01-15 09:30 AM', event: 'Driver assigned', status: 'completed' },
      { time: '2024-01-15 10:00 AM', event: 'Driver en route to pickup', status: 'completed' },
      { time: '2024-01-15 10:15 AM', event: 'Package picked up', status: 'completed' },
      { time: '2024-01-15 11:00 AM', event: 'In transit', status: 'current' },
      { time: '2024-01-15 14:00 PM', event: 'Out for delivery', status: 'pending' },
      { time: '2024-01-15 15:00 PM', event: 'Delivered', status: 'pending' }
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'assigned':
        return 'info';
      case 'in_transit':
        return 'warning';
      case 'out_for_delivery':
        return 'primary';
      case 'delivered':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getTimelineColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'current':
        return 'primary';
      case 'pending':
        return 'default';
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
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/deliveries')}
          >
            Back to Deliveries
          </Button>
          <Typography variant="h4" component="h1">
            Delivery Details
          </Typography>
        </Box>
        
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => console.log('Edit delivery')}
          >
            Edit Delivery
          </Button>
          <Button
            variant="outlined"
            startIcon={<MapIcon />}
            onClick={() => console.log('Track on map')}
          >
            Track on Map
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Delivery Summary */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Delivery Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Order Number
                </Typography>
                <Typography variant="body1">
                  {delivery.orderNumber}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={getStatusLabel(delivery.status)}
                  color={getStatusColor(delivery.status) as any}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Driver
                </Typography>
                <Typography variant="body1">
                  {delivery.driver}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Notes
                </Typography>
                <Typography variant="body1">
                  {delivery.notes}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Timeline */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Delivery Timeline
            </Typography>
            <List>
              {delivery.timeline.map((item, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: getTimelineColor(item.status) === 'success' ? 'success.main' :
                                   getTimelineColor(item.status) === 'primary' ? 'primary.main' : 'grey.400'
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.event}
                      secondary={item.time}
                    />
                  </ListItem>
                  {index < delivery.timeline.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Customer & Address Info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Customer Information
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText primary="Phone" secondary={delivery.phone} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText primary="Email" secondary={delivery.email} />
              </ListItem>
            </List>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Pickup Address
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <LocationIcon color="primary" />
              <Typography variant="body2">
                {delivery.pickupAddress}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Estimated: {delivery.estimatedPickup}
            </Typography>
            {delivery.actualPickup && (
              <Typography variant="body2" color="success.main">
                Actual: {delivery.actualPickup}
              </Typography>
            )}
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Delivery Address
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <LocationIcon color="primary" />
              <Typography variant="body2">
                {delivery.deliveryAddress}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Estimated: {delivery.estimatedDelivery}
            </Typography>
            {delivery.actualDelivery && (
              <Typography variant="body2" color="success.main">
                Actual: {delivery.actualDelivery}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DeliveryDetailsPage;
