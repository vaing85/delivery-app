import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  LocalShipping as DeliveryIcon,
  Star as StarIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  DirectionsCar as VehicleIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isAvailable: boolean;
  vehicleType: string;
  vehicleModel: string;
  rating: number;
  totalDeliveries: number;
  joinedDate: string;
  currentLocation?: string;
  lastActive?: string;
  earnings?: number;
  completionRate?: number;
  averageDeliveryTime?: number;
  onTimeRate?: number;
}

interface Delivery {
  id: string;
  orderId: string;
  customerName: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: string;
  scheduledTime: string;
  completedTime?: string;
  rating?: number;
  earnings: number;
}

const DriverDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { driverId } = useParams<{ driverId: string }>();
  const { user } = useAuthStore();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [recentDeliveries, setRecentDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data - in real app, you'd fetch this from API
  const mockDrivers: Driver[] = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      phone: '+1 (555) 123-4567',
      isAvailable: true,
      vehicleType: 'Car',
      vehicleModel: 'Toyota Camry',
      rating: 4.8,
      totalDeliveries: 156,
      joinedDate: '2024-01-15',
      currentLocation: 'Downtown',
      lastActive: '2 minutes ago',
      earnings: 2847.50,
      completionRate: 98.2,
      averageDeliveryTime: 28.5,
      onTimeRate: 94.2,
    },
    {
      id: '2',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+1 (555) 234-5678',
      isAvailable: false,
      vehicleType: 'Van',
      vehicleModel: 'Ford Transit',
      rating: 4.9,
      totalDeliveries: 203,
      joinedDate: '2023-11-20',
      currentLocation: 'Business District',
      lastActive: '15 minutes ago',
      earnings: 3201.75,
      completionRate: 99.1,
      averageDeliveryTime: 25.3,
      onTimeRate: 96.8,
    },
    {
      id: '3',
      firstName: 'Mike',
      lastName: 'Davis',
      email: 'mike.davis@example.com',
      phone: '+1 (555) 345-6789',
      isAvailable: true,
      vehicleType: 'Motorcycle',
      vehicleModel: 'Honda CB500X',
      rating: 4.6,
      totalDeliveries: 89,
      joinedDate: '2024-03-10',
      currentLocation: 'Residential North',
      lastActive: '1 minute ago',
      earnings: 1654.20,
      completionRate: 95.8,
      averageDeliveryTime: 32.1,
      onTimeRate: 91.5,
    },
  ];

  const getMockDeliveries = (driverId: string): Delivery[] => {
    const deliveriesByDriver: { [key: string]: Delivery[] } = {
      '1': [ // John Smith
        {
          id: '1',
          orderId: 'ORD-001',
          customerName: 'Alice Johnson',
          pickupAddress: '123 Main St, Downtown',
          deliveryAddress: '456 Oak Ave, Residential',
          status: 'DELIVERED',
          scheduledTime: '2024-01-15T10:00:00Z',
          completedTime: '2024-01-15T10:25:00Z',
          rating: 5,
          earnings: 12.50,
        },
        {
          id: '2',
          orderId: 'ORD-002',
          customerName: 'Bob Wilson',
          pickupAddress: '789 Pine St, Business District',
          deliveryAddress: '321 Elm St, Suburbs',
          status: 'IN_TRANSIT',
          scheduledTime: '2024-01-15T11:30:00Z',
          earnings: 15.00,
        },
        {
          id: '3',
          orderId: 'ORD-003',
          customerName: 'Carol Davis',
          pickupAddress: '654 Maple Dr, Industrial',
          deliveryAddress: '987 Cedar Ln, Residential',
          status: 'DELIVERED',
          scheduledTime: '2024-01-15T09:15:00Z',
          completedTime: '2024-01-15T09:45:00Z',
          rating: 4,
          earnings: 18.75,
        },
      ],
      '2': [ // Sarah Johnson
        {
          id: '4',
          orderId: 'ORD-004',
          customerName: 'David Brown',
          pickupAddress: '555 Business Ave, Corporate',
          deliveryAddress: '777 Executive Blvd, Office Park',
          status: 'DELIVERED',
          scheduledTime: '2024-01-15T08:30:00Z',
          completedTime: '2024-01-15T08:55:00Z',
          rating: 5,
          earnings: 22.00,
        },
        {
          id: '5',
          orderId: 'ORD-005',
          customerName: 'Emma Wilson',
          pickupAddress: '999 Warehouse St, Industrial',
          deliveryAddress: '111 Factory Rd, Manufacturing',
          status: 'DELIVERED',
          scheduledTime: '2024-01-15T14:00:00Z',
          completedTime: '2024-01-15T14:20:00Z',
          rating: 4,
          earnings: 28.50,
        },
        {
          id: '6',
          orderId: 'ORD-006',
          customerName: 'Frank Miller',
          pickupAddress: '333 Distribution Center, Logistics',
          deliveryAddress: '444 Supply Chain Ave, Operations',
          status: 'PICKED_UP',
          scheduledTime: '2024-01-15T16:00:00Z',
          earnings: 35.00,
        },
      ],
      '3': [ // Mike Davis
        {
          id: '7',
          orderId: 'ORD-007',
          customerName: 'Grace Lee',
          pickupAddress: '222 Residential St, Suburbs',
          deliveryAddress: '888 Home Ave, Neighborhood',
          status: 'DELIVERED',
          scheduledTime: '2024-01-15T12:00:00Z',
          completedTime: '2024-01-15T12:35:00Z',
          rating: 4,
          earnings: 16.75,
        },
        {
          id: '8',
          orderId: 'ORD-008',
          customerName: 'Henry Taylor',
          pickupAddress: '666 Apartment Complex, Urban',
          deliveryAddress: '999 Condo Building, Downtown',
          status: 'IN_TRANSIT',
          scheduledTime: '2024-01-15T15:30:00Z',
          earnings: 14.25,
        },
        {
          id: '9',
          orderId: 'ORD-009',
          customerName: 'Ivy Chen',
          pickupAddress: '777 Student Housing, Campus',
          deliveryAddress: '555 Dormitory Hall, University',
          status: 'DELIVERED',
          scheduledTime: '2024-01-15T13:15:00Z',
          completedTime: '2024-01-15T13:50:00Z',
          rating: 5,
          earnings: 19.50,
        },
      ],
    };
    
    return deliveriesByDriver[driverId] || [];
  };

  useEffect(() => {
    // Simulate API call
    const fetchDriverDetails = async () => {
      setLoading(true);
      try {
        // Mock API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Find the driver by ID
        const foundDriver = mockDrivers.find(d => d.id === driverId);
        if (foundDriver) {
          setDriver(foundDriver);
          setRecentDeliveries(getMockDeliveries(driverId));
        } else {
          setError('Driver not found');
        }
      } catch (err) {
        setError('Failed to load driver details');
      } finally {
        setLoading(false);
      }
    };

    if (driverId) {
      fetchDriverDetails();
    }
  }, [driverId]);

  const handleEditDriver = () => {
    navigate(`/drivers/${driverId}/edit`);
  };

  const handleDeleteDriver = () => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      // In real app, call delete API
      navigate('/drivers');
    }
  };

  const handleToggleAvailability = () => {
    if (driver) {
      setDriver({ ...driver, isAvailable: !driver.isAvailable });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'success';
      case 'IN_TRANSIT':
        return 'info';
      case 'PICKED_UP':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircleIcon />;
      case 'IN_TRANSIT':
        return <DeliveryIcon />;
      case 'PICKED_UP':
        return <WarningIcon />;
      default:
        return <CancelIcon />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ flexGrow: 1, p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading driver details...
        </Typography>
      </Box>
    );
  }

  if (error || !driver) {
    return (
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Alert severity="error">
          {error || 'Driver not found'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/drivers')}
          >
            Back to Drivers
          </Button>
        </Box>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={3}>
            <Avatar sx={{ width: 80, height: 80, fontSize: 32 }}>
              {driver.firstName[0]}{driver.lastName[0]}
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {driver.firstName} {driver.lastName}
              </Typography>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <Chip
                  label={driver.isAvailable ? 'Available' : 'Offline'}
                  color={driver.isAvailable ? 'success' : 'default'}
                  onClick={handleToggleAvailability}
                  sx={{ cursor: 'pointer' }}
                />
                <Box display="flex" alignItems="center">
                  <StarIcon sx={{ fontSize: 20, color: 'warning.main', mr: 0.5 }} />
                  <Typography variant="h6" color="warning.main">
                    {driver.rating.toFixed(1)}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Driver since {new Date(driver.joinedDate).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            <Tooltip title="Edit Driver">
              <IconButton color="primary" onClick={handleEditDriver}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Driver">
              <IconButton color="error" onClick={handleDeleteDriver}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Driver Information */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Contact Information
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Email" 
                    secondary={driver.email}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Phone" 
                    secondary={driver.phone}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LocationIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Current Location" 
                    secondary={driver.currentLocation || 'Not available'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <TimeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Last Active" 
                    secondary={driver.lastActive || 'Unknown'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Vehicle Information
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <VehicleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Vehicle Type" 
                    secondary={driver.vehicleType}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <VehicleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Vehicle Model" 
                    secondary={driver.vehicleModel}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {/* Key Metrics */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Performance Metrics
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="primary.main" fontWeight="bold">
                          {driver.totalDeliveries}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Deliveries
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="success.main" fontWeight="bold">
                          {driver.completionRate?.toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Completion Rate
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="info.main" fontWeight="bold">
                          {driver.averageDeliveryTime?.toFixed(0)}m
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Avg Delivery Time
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="warning.main" fontWeight="bold">
                          {driver.onTimeRate?.toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          On-Time Rate
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Earnings */}
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Earnings
                  </Typography>
                  <Box display="flex" alignItems="center" mb={2}>
                    <MoneyIcon color="success" sx={{ mr: 1, fontSize: 32 }} />
                    <Box>
                      <Typography variant="h4" color="success.main" fontWeight="bold">
                        ${driver.earnings?.toLocaleString() || '0'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Earnings
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Average per delivery: ${((driver.earnings || 0) / driver.totalDeliveries).toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Rating Breakdown */}
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Rating Breakdown
                  </Typography>
                  <Box mb={2}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Overall Rating</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {driver.rating.toFixed(1)}/5.0
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(driver.rating / 5) * 100} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Based on customer feedback from {driver.totalDeliveries} deliveries
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Deliveries */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Recent Deliveries
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Order ID</TableCell>
                          <TableCell>Customer</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Scheduled</TableCell>
                          <TableCell>Completed</TableCell>
                          <TableCell>Rating</TableCell>
                          <TableCell>Earnings</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recentDeliveries.map((delivery) => (
                          <TableRow key={delivery.id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {delivery.orderId}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {delivery.customerName}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={delivery.status.replace('_', ' ')}
                                color={getStatusColor(delivery.status) as any}
                                size="small"
                                icon={getStatusIcon(delivery.status)}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {new Date(delivery.scheduledTime).toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {delivery.completedTime 
                                  ? new Date(delivery.completedTime).toLocaleString()
                                  : '-'
                                }
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {delivery.rating ? (
                                <Box display="flex" alignItems="center">
                                  <StarIcon sx={{ fontSize: 16, color: 'warning.main', mr: 0.5 }} />
                                  <Typography variant="body2">
                                    {delivery.rating}
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  -
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                ${delivery.earnings.toFixed(2)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DriverDetailsPage;
