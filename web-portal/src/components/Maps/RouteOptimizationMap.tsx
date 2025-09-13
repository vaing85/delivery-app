import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Grid,
  Divider
} from '@mui/material';
import {
  Route as RouteIcon,
  Navigation as NavigationIcon,
  LocalShipping as DeliveryIcon,
  AccessTime as TimeIcon,
  DirectionsCar as CarIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import GoogleMapComponent from './GoogleMapComponent';
import { driverAPI } from '../../services/api';

interface DeliveryPoint {
  id: string;
  orderId: string;
  customerName: string;
  address: string;
  position: { lat: number; lng: number };
  estimatedTime?: number;
  estimatedDistance?: number;
  optimizedOrder?: number;
}

interface OptimizedRoute {
  deliveries: Array<DeliveryPoint & {
    optimizedOrder: number;
    estimatedArrival: string;
    distance: number;
    duration: number;
  }>;
  totalDistance: number;
  totalDuration: number;
  fuelEfficiency: string;
  isOptimized: boolean;
  optimizationTimestamp: string;
  polyline?: string;
}

interface RouteOptimizationMapProps {
  currentLocation?: { lat: number; lng: number };
  onRouteOptimized?: (route: OptimizedRoute) => void;
}

const RouteOptimizationMap: React.FC<RouteOptimizationMapProps> = ({
  currentLocation = { lat: 40.7128, lng: -74.0060 },
  onRouteOptimized
}) => {
  const [deliveries, setDeliveries] = useState<DeliveryPoint[]>([
    {
      id: '1',
      orderId: 'ORD-001',
      customerName: 'John Doe',
      address: '123 Main St, New York, NY',
      position: { lat: 40.7589, lng: -73.9851 }
    },
    {
      id: '2',
      orderId: 'ORD-002',
      customerName: 'Jane Smith',
      address: '456 Broadway, New York, NY',
      position: { lat: 40.7505, lng: -73.9934 }
    },
    {
      id: '3',
      orderId: 'ORD-003',
      customerName: 'Bob Johnson',
      address: '789 5th Ave, New York, NY',
      position: { lat: 40.7614, lng: -73.9776 }
    }
  ]);

  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDelivery, setNewDelivery] = useState({
    orderId: '',
    customerName: '',
    address: '',
    lat: '',
    lng: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Map markers
  const mapMarkers = [
    {
      id: 'current-location',
      position: currentLocation,
      title: 'Current Location',
      icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
    },
    ...deliveries.map(delivery => ({
      id: delivery.id,
      position: delivery.position,
      title: `${delivery.customerName} - ${delivery.orderId}`,
      icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
    }))
  ];

  // Map routes
  const mapRoutes = optimizedRoute ? [{
    id: 'optimized-route',
    path: [
      currentLocation,
      ...optimizedRoute.deliveries
        .sort((a, b) => a.optimizedOrder - b.optimizedOrder)
        .map(d => d.position)
    ],
    color: '#1976d2',
    strokeWeight: 4
  }] : [];

  const handleOptimizeRoute = async () => {
    setIsOptimizing(true);
    try {
      const routeData = {
        deliveries: deliveries.map(d => ({
          orderId: d.orderId,
          latitude: d.position.lat,
          longitude: d.position.lng
        })),
        currentLocation
      };

      const response = await driverAPI.optimizeRoute(routeData);

      if (response.success) {
        const optimized: OptimizedRoute = {
          deliveries: response.data.deliveries.map((d: any, index: number) => ({
            ...deliveries.find(del => del.orderId === d.orderId)!,
            optimizedOrder: d.optimizedOrder,
            estimatedArrival: d.estimatedArrival,
            distance: d.distance,
            duration: d.duration
          })),
          totalDistance: response.data.totalDistance,
          totalDuration: response.data.totalDuration,
          fuelEfficiency: response.data.fuelEfficiency,
          isOptimized: response.data.isOptimized,
          optimizationTimestamp: response.data.optimizationTimestamp,
          polyline: response.data.polyline
        };

        setOptimizedRoute(optimized);
        onRouteOptimized?.(optimized);

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
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleAddDelivery = () => {
    if (!newDelivery.orderId || !newDelivery.customerName || !newDelivery.address) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields.',
        severity: 'warning'
      });
      return;
    }

    const lat = parseFloat(newDelivery.lat);
    const lng = parseFloat(newDelivery.lng);

    if (isNaN(lat) || isNaN(lng)) {
      setSnackbar({
        open: true,
        message: 'Please enter valid coordinates.',
        severity: 'warning'
      });
      return;
    }

    const delivery: DeliveryPoint = {
      id: Date.now().toString(),
      orderId: newDelivery.orderId,
      customerName: newDelivery.customerName,
      address: newDelivery.address,
      position: { lat, lng }
    };

    setDeliveries(prev => [...prev, delivery]);
    setNewDelivery({ orderId: '', customerName: '', address: '', lat: '', lng: '' });
    setShowAddDialog(false);

    setSnackbar({
      open: true,
      message: 'Delivery point added successfully!',
      severity: 'success'
    });
  };

  const handleRemoveDelivery = (id: string) => {
    setDeliveries(prev => prev.filter(d => d.id !== id));
    setOptimizedRoute(null);
  };

  const handleMapClick = (event: { lat: number; lng: number }) => {
    setNewDelivery(prev => ({
      ...prev,
      lat: event.lat.toFixed(6),
      lng: event.lng.toFixed(6)
    }));
  };

  return (
    <>
      <Grid container spacing={3}>
        {/* Map */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Route Optimization Map</Typography>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setShowAddDialog(true)}
                >
                  Add Delivery
                </Button>
                <Button
                  variant="contained"
                  startIcon={isOptimizing ? <RefreshIcon className="animate-spin" /> : <RouteIcon />}
                  onClick={handleOptimizeRoute}
                  disabled={isOptimizing || deliveries.length === 0}
                >
                  {isOptimizing ? 'Optimizing...' : 'Optimize Route'}
                </Button>
              </Box>
            </Box>

            <GoogleMapComponent
              center={currentLocation}
              zoom={12}
              markers={mapMarkers}
              routes={mapRoutes}
              onMapClick={handleMapClick}
              height={500}
              showControls={true}
              showCurrentLocation={true}
            />
          </Paper>
        </Grid>

        {/* Route Information */}
        <Grid item xs={12} md={4}>
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Route Summary */}
            {optimizedRoute && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Optimized Route
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CarIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Total Distance"
                        secondary={`${optimizedRoute.totalDistance.toFixed(1)} km`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <TimeIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Total Duration"
                        secondary={`${Math.round(optimizedRoute.totalDuration)} minutes`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <TrendingUpIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Fuel Efficiency"
                        secondary={optimizedRoute.fuelEfficiency}
                      />
                    </ListItem>
                  </List>
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Optimized"
                    color="success"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Delivery Points */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Delivery Points ({deliveries.length})
                </Typography>
                <List dense>
                  {deliveries.map((delivery, index) => (
                    <ListItem key={delivery.id} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <DeliveryIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${delivery.customerName} - ${delivery.orderId}`}
                        secondary={delivery.address}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveDelivery(delivery.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* Optimized Route Steps */}
            {optimizedRoute && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Delivery Sequence
                  </Typography>
                  <List dense>
                    {optimizedRoute.deliveries
                      .sort((a, b) => a.optimizedOrder - b.optimizedOrder)
                      .map((delivery, index) => (
                        <ListItem key={delivery.id} sx={{ px: 0 }}>
                          <ListItemIcon>
                            <Typography variant="body2" fontWeight="bold">
                              {delivery.optimizedOrder}
                            </Typography>
                          </ListItemIcon>
                          <ListItemText
                            primary={delivery.customerName}
                            secondary={
                              <Box>
                                <Typography variant="caption" display="block">
                                  {delivery.address}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {delivery.duration} min • {delivery.distance.toFixed(1)} km
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                  </List>
                </CardContent>
              </Card>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Add Delivery Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Delivery Point</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Order ID"
              value={newDelivery.orderId}
              onChange={(e) => setNewDelivery(prev => ({ ...prev, orderId: e.target.value }))}
              required
            />
            <TextField
              fullWidth
              label="Customer Name"
              value={newDelivery.customerName}
              onChange={(e) => setNewDelivery(prev => ({ ...prev, customerName: e.target.value }))}
              required
            />
            <TextField
              fullWidth
              label="Address"
              value={newDelivery.address}
              onChange={(e) => setNewDelivery(prev => ({ ...prev, address: e.target.value }))}
              multiline
              rows={2}
              required
            />
            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                label="Latitude"
                value={newDelivery.lat}
                onChange={(e) => setNewDelivery(prev => ({ ...prev, lat: e.target.value }))}
                type="number"
                inputProps={{ step: "0.000001" }}
              />
              <TextField
                fullWidth
                label="Longitude"
                value={newDelivery.lng}
                onChange={(e) => setNewDelivery(prev => ({ ...prev, lng: e.target.value }))}
                type="number"
                inputProps={{ step: "0.000001" }}
              />
            </Box>
            <Alert severity="info">
              Click on the map to automatically fill coordinates, or enter them manually.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddDelivery} variant="contained">
            Add Delivery
          </Button>
        </DialogActions>
      </Dialog>

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

export default RouteOptimizationMap;
