import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { CircularProgress } from '@mui/material';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  LocalShipping as DeliveryIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Map as MapIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

// Mock data for demonstration
const mockDeliveries = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    customer: 'John Doe',
    driver: 'Mike Johnson',
    status: 'in_transit',
    pickupAddress: '123 Main St, City',
    deliveryAddress: '456 Oak Ave, Town',
    estimatedDelivery: '2024-01-15 14:00',
    phone: '+1-555-0123',
    email: 'john.doe@email.com'
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    customer: 'Jane Smith',
    driver: 'Sarah Wilson',
    status: 'out_for_delivery',
    pickupAddress: '789 Pine Rd, Village',
    deliveryAddress: '321 Elm St, Borough',
    estimatedDelivery: '2024-01-15 16:00',
    phone: '+1-555-0456',
    email: 'jane.smith@email.com'
  },
  {
    id: '3',
    orderNumber: 'ORD-003',
    customer: 'Bob Johnson',
    driver: 'Tom Davis',
    status: 'delivered',
    pickupAddress: '654 Maple Dr, County',
    deliveryAddress: '987 Cedar Ln, District',
    estimatedDelivery: '2024-01-15 12:00',
    phone: '+1-555-0789',
    email: 'bob.johnson@email.com'
  }
];

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

const DeliveriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
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
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
          <Typography variant="h4" component="h1">
            Deliveries
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<DeliveryIcon />}
          onClick={() => navigate('/deliveries/create')}
        >
          New Delivery
        </Button>
      </Box>

      <Grid container spacing={3}>
        {mockDeliveries.map((delivery) => (
          <Grid item xs={12} md={6} lg={4} key={delivery.id}>
            <Paper elevation={2}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="h2">
                      {delivery.orderNumber}
                    </Typography>
                    <Chip
                      label={getStatusLabel(delivery.status)}
                      color={getStatusColor(delivery.status) as any}
                      size="small"
                    />
                  </Box>

                  <Box display="flex" alignItems="center" mb={1}>
                    <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {delivery.customer}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" mb={1}>
                    <DeliveryIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {delivery.driver}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" mb={1}>
                    <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {delivery.pickupAddress}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" mb={1}>
                    <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {delivery.deliveryAddress}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" mb={2}>
                    <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {delivery.phone}
                    </Typography>
                  </Box>

                  <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                    Estimated Delivery: {delivery.estimatedDelivery}
                  </Typography>

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => navigate(`/deliveries/${delivery.id}`)}>
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Delivery">
                        <IconButton size="small" onClick={() => console.log('Edit delivery', delivery.id)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Track on Map">
                        <IconButton size="small" onClick={() => console.log('Track delivery', delivery.id)}>
                          <MapIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DeliveriesPage;
