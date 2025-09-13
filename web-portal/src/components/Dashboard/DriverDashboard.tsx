import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  Switch,
  FormControlLabel,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Fab,
  Badge,
} from '@mui/material';
import {
  LocalShipping as DeliveryIcon,
  LocationOn as LocationOnIcon,
  Star as StarIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  Notifications as NotificationIcon,
  MyLocation as MyLocationIcon,
  Route as RouteIcon,
  CameraAlt as CameraIcon,
  Navigation as NavigationIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../../services/websocketService';
import { useAuthStore } from '../../store/authStore';
import { driverAPI } from '../../services/api';

interface DriverDashboardProps {
  stats: {
    totalDeliveries: number;
    completedDeliveries: number;
    pendingDeliveries: number;
    totalEarnings: number;
    rating: number;
    totalTrips: number;
  };
  recentDeliveries: Array<{
    id: string;
    orderNumber: string;
    status: string;
    pickupAddress: string;
    deliveryAddress: string;
    customerName: string;
    estimatedTime: string;
  }>;
  driverProfile: {
    isAvailable: boolean;
    vehicleType: string;
    vehicleModel: string;
    currentLocation: {
      lat: number;
      lng: number;
    };
  };
  onRefresh: () => void;
  onToggleAvailability: (available: boolean) => void;
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ 
  stats, 
  recentDeliveries, 
  driverProfile,
  onRefresh, 
  onToggleAvailability 
}) => {
  const navigate = useNavigate();
  
  // Enhanced state for real-time features
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(driverProfile.currentLocation);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [photoNote, setPhotoNote] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });
  const [routeOptimization, setRouteOptimization] = useState({
    isOptimized: false,
    estimatedTime: '25 min',
    distance: '8.5 km',
    fuelEfficiency: 'Good'
  });

  // Real-time location tracking
  useEffect(() => {
    let watchId: number | null = null;
    
    if (isTrackingLocation && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(newLocation);
          setLocationAccuracy(position.coords.accuracy);
          setLastLocationUpdate(new Date());
          
          // In a real app, you would send this to the backend
          console.log('Location updated:', newLocation);
        },
        (error) => {
          console.error('Location tracking error:', error);
          setSnackbar({
            open: true,
            message: 'Location tracking failed. Please check permissions.',
            severity: 'error'
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isTrackingLocation]);

  // WebSocket integration
  const { connect, disconnect, setEventHandlers, emitLocationUpdate, isConnected } = useWebSocket();
  const { user, token } = useAuthStore();

  useEffect(() => {
    if (token && user) {
      connect();
      
      setEventHandlers({
        onOrderUpdate: (data) => {
          console.log('Order update received:', data);
          setSnackbar({
            open: true,
            message: `Order ${data.orderId} status updated to ${data.status}`,
            severity: 'info'
          });
        },
        onNotification: (data) => {
          console.log('Notification received:', data);
          setSnackbar({
            open: true,
            message: data.message,
            severity: 'info'
          });
        }
      });
    }

    return () => {
      disconnect();
    };
  }, [token, user, connect, disconnect, setEventHandlers]);

  // Send location updates via WebSocket
  useEffect(() => {
    if (isTrackingLocation && isConnected && currentLocation) {
      emitLocationUpdate({
        latitude: currentLocation.lat,
        longitude: currentLocation.lng
      });
    }
  }, [currentLocation, isTrackingLocation, isConnected, emitLocationUpdate]);

  const handleLocationToggle = () => {
    if (!isTrackingLocation) {
      if (navigator.geolocation) {
        setIsTrackingLocation(true);
        setSnackbar({
          open: true,
          message: 'Location tracking started',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Geolocation not supported',
          severity: 'error'
        });
      }
    } else {
      setIsTrackingLocation(false);
      setSnackbar({
        open: true,
        message: 'Location tracking stopped',
        severity: 'info'
      });
    }
  };

  const handlePhotoCapture = (delivery: any) => {
    setSelectedDelivery(delivery);
    setShowPhotoDialog(true);
  };

  const handlePhotoSubmit = () => {
    // In a real app, you would capture and upload the photo
    setSnackbar({
      open: true,
      message: `Photo captured for delivery #${selectedDelivery.orderNumber}`,
      severity: 'success'
    });
    setShowPhotoDialog(false);
    setPhotoNote('');
    setSelectedDelivery(null);
  };

  const handleRouteOptimize = async () => {
    try {
      // Mock delivery data for optimization
      const deliveries = [
        { orderId: '1', latitude: 40.7128, longitude: -74.0060 },
        { orderId: '2', latitude: 40.7589, longitude: -73.9851 },
        { orderId: '3', latitude: 40.7505, longitude: -73.9934 }
      ];

      const currentLocation = { latitude: 40.7128, longitude: -74.0060 };

      const response = await driverAPI.optimizeRoute({
        deliveries,
        currentLocation
      });

      if (response.success) {
        setRouteOptimization({
          isOptimized: true,
          estimatedTime: `${Math.round(response.data.totalDuration)} min`,
          distance: `${response.data.totalDistance.toFixed(1)} km`,
          fuelEfficiency: response.data.fuelEfficiency
        });
        
        setSnackbar({
          open: true,
          message: 'Route optimized successfully!',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Route optimization failed:', error);
      setSnackbar({
        open: true,
        message: 'Failed to optimize route. Please try again.',
        severity: 'error'
      });
    }
  };

  return (
    <>
      {/* Driver Status & Vehicle Info */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Driver Status & Vehicle
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="subtitle1">
                    Availability Status
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={driverProfile.isAvailable}
                        onChange={(e) => onToggleAvailability(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={driverProfile.isAvailable ? "Available" : "Offline"}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {driverProfile.isAvailable 
                    ? "You're currently accepting deliveries" 
                    : "You're currently offline"
                  }
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <DeliveryIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">
                    Vehicle Information
                  </Typography>
                </Box>
                <Typography variant="h6" color="primary.main">
                  {driverProfile.vehicleType}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {driverProfile.vehicleModel}
                </Typography>
                                 <Button 
                   size="small" 
                   variant="outlined" 
                   sx={{ mt: 1 }}
                   onClick={() => navigate('/settings')}
                 >
                   Update Vehicle
                 </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center">
                    <LocationOnIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">
                      Real-Time Location
                    </Typography>
                  </Box>
                  <IconButton 
                    size="small" 
                    onClick={handleLocationToggle}
                    color={isTrackingLocation ? "success" : "default"}
                  >
                    <MyLocationIcon />
                  </IconButton>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  Lat: {currentLocation.lat.toFixed(6)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Lng: {currentLocation.lng.toFixed(6)}
                </Typography>
                
                {locationAccuracy && (
                  <Typography variant="caption" color="text.secondary">
                    Accuracy: ±{Math.round(locationAccuracy)}m
                  </Typography>
                )}
                
                {lastLocationUpdate && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Updated: {lastLocationUpdate.toLocaleTimeString()}
                  </Typography>
                )}
                
                <Box display="flex" gap={1} mt={2}>
                  <Button 
                    size="small" 
                    variant={isTrackingLocation ? "contained" : "outlined"}
                    color={isTrackingLocation ? "success" : "primary"}
                    onClick={handleLocationToggle}
                    startIcon={isTrackingLocation ? <CheckCircleIcon /> : <MyLocationIcon />}
                  >
                    {isTrackingLocation ? 'Tracking' : 'Start Tracking'}
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => navigate('/map')}
                    startIcon={<NavigationIcon />}
                  >
                    View Map
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Driver Performance Stats */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Performance Statistics
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Deliveries
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {stats.totalDeliveries}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All time deliveries
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Completed
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.completedDeliveries}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Successful deliveries
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.pendingDeliveries}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active deliveries
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Earnings
                </Typography>
                <Typography variant="h4" color="success.main">
                  ${stats.totalEarnings.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Lifetime earnings
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Route Optimization & Navigation */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Route Optimization & Navigation
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center">
                    <RouteIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">
                      Current Route
                    </Typography>
                  </Box>
                  <Chip 
                    label={routeOptimization.isOptimized ? "Optimized" : "Standard"} 
                    color={routeOptimization.isOptimized ? "success" : "default"}
                    size="small"
                  />
                </Box>
                
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <NavigationIcon color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Estimated Time"
                      secondary={routeOptimization.estimatedTime}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <RouteIcon color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Distance"
                      secondary={routeOptimization.distance}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUpIcon color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Fuel Efficiency"
                      secondary={routeOptimization.fuelEfficiency}
                    />
                  </ListItem>
                </List>
                
                <Box display="flex" gap={1} mt={2}>
                  <Button 
                    size="small" 
                    variant="contained"
                    onClick={handleRouteOptimize}
                    disabled={routeOptimization.isOptimized}
                    startIcon={<RouteIcon />}
                  >
                    Optimize Route
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => navigate('/navigation')}
                    startIcon={<NavigationIcon />}
                  >
                    Start Navigation
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <CameraIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">
                    Delivery Photo Capture
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Capture photos for delivery confirmation and customer updates
                </Typography>
                
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Delivery Confirmation"
                      secondary="Photo proof of successful delivery"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <WarningIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Issue Documentation"
                      secondary="Document any delivery issues"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CameraIcon color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Customer Updates"
                      secondary="Share delivery progress photos"
                    />
                  </ListItem>
                </List>
                
                <Button 
                  size="small" 
                  variant="contained"
                  onClick={() => navigate('/camera')}
                  startIcon={<CameraIcon />}
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  Open Camera
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Driver Rating & Performance */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Rating & Performance
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <StarIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h5">
                    Customer Rating
                  </Typography>
                </Box>
                <Typography variant="h3" color="primary.main" gutterBottom>
                  {stats.rating}/5.0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Based on {stats.totalTrips} trips
                </Typography>
                <Box mt={2}>
                  <Typography variant="body2" color="text.secondary">
                    Target: 4.8+ rating
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <Box flex={1} mr={1}>
                      <LinearProgress 
                        variant="determinate" 
                        value={(stats.rating / 5) * 100} 
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {Math.round((stats.rating / 5) * 100)}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Metrics
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUpIcon color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary="On-Time Rate"
                      secondary="94% (Target: 90%)"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <StarIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Customer Satisfaction"
                      secondary="4.7/5.0 (Target: 4.5+)"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUpIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Efficiency Score"
                      secondary="87% (Target: 85%)"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Recent Deliveries */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Recent Deliveries
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/deliveries')}>
            View All Deliveries
          </Button>
        </Box>
        {recentDeliveries.length > 0 ? (
          <List>
            {recentDeliveries.slice(0, 5).map((delivery, index) => (
              <React.Fragment key={delivery.id}>
                <ListItem>
                  <ListItemIcon>
                    <DeliveryIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`Delivery #${delivery.orderNumber}`}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Customer: {delivery.customerName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          From: {delivery.pickupAddress}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          To: {delivery.deliveryAddress}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ETA: {delivery.estimatedTime}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
                    <Chip 
                      label={delivery.status} 
                      color={
                        delivery.status === 'COMPLETED' ? 'success' : 
                        delivery.status === 'IN_PROGRESS' ? 'warning' : 
                        delivery.status === 'PENDING' ? 'info' : 'default'
                      } 
                      size="small" 
                    />
                    <Box display="flex" flexDirection="column" gap={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/deliveries/${delivery.id}`)}
                      >
                        View Details
                      </Button>
                      {delivery.status === 'IN_PROGRESS' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => handlePhotoCapture(delivery)}
                          startIcon={<CameraIcon />}
                        >
                          Capture Photo
                        </Button>
                      )}
                    </Box>
                  </Box>
                </ListItem>
                {index < recentDeliveries.slice(0, 5).length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box textAlign="center" py={3}>
            <Typography variant="body1" color="text.secondary">
              No deliveries yet. You'll see them here when assigned.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Photo Capture Dialog */}
      <Dialog open={showPhotoDialog} onClose={() => setShowPhotoDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <CameraIcon color="primary" sx={{ mr: 1 }} />
            Capture Delivery Photo
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedDelivery && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Delivery #{selectedDelivery.orderNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Customer: {selectedDelivery.customerName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Address: {selectedDelivery.deliveryAddress}
              </Typography>
              
              <Box mt={3} mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Photo Preview
                </Typography>
                <Box 
                  sx={{ 
                    width: '100%', 
                    height: 200, 
                    border: '2px dashed #ccc', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: '#f5f5f5'
                  }}
                >
                  <Box textAlign="center">
                    <CameraIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Camera preview will appear here
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <TextField
                fullWidth
                label="Delivery Note (Optional)"
                multiline
                rows={3}
                value={photoNote}
                onChange={(e) => setPhotoNote(e.target.value)}
                placeholder="Add any notes about the delivery..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPhotoDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handlePhotoSubmit} 
            variant="contained" 
            startIcon={<CameraIcon />}
          >
            Capture & Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
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

      {/* Floating Action Button for Quick Actions */}
      <Fab
        color="primary"
        aria-label="quick actions"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={() => navigate('/quick-actions')}
      >
        <NavigationIcon />
      </Fab>
    </>
  );
};

export default DriverDashboard;
