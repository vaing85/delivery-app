import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  LocalShipping as DeliveryIcon,
  Phone as PhoneIcon,
  DirectionsCar as VehicleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

interface TrackingData {
  orderId: string;
  orderNumber: string;
  status: string;
  currentLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  pickupLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  deliveryLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  estimatedArrival: string;
  driver: {
    id: string;
    name: string;
    phone: string;
    vehicle: string;
  };
  route: Array<{
    lat: number;
    lng: number;
    timestamp: string;
  }>;
}

interface TrackingMapProps {
  orderId: string;
}

const TrackingMap: React.FC<TrackingMapProps> = ({ orderId }) => {
  const [isLiveTracking, setIsLiveTracking] = useState(false);

  // Fetch tracking data
  const { data: trackingData, isLoading, error } = useQuery({
    queryKey: ['tracking', orderId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:5000/api/tracking/${orderId}`);
      return response.json();
    },
    refetchInterval: isLiveTracking ? 10000 : false, // Refresh every 10 seconds if live tracking
  });

  // Live tracking data
  const { data: liveData } = useQuery({
    queryKey: ['live-tracking', orderId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:5000/api/tracking/${orderId}/live`);
      return response.json();
    },
    enabled: isLiveTracking,
    refetchInterval: isLiveTracking ? 5000 : false, // Refresh every 5 seconds if live tracking
  });

  const toggleLiveTracking = () => {
    setIsLiveTracking(!isLiveTracking);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load tracking information. Please try again.
        </Alert>
      </Box>
    );
  }

  const data: TrackingData = trackingData?.data;
  const liveLocation = liveData?.data;

  if (!data) {
    return (
      <Box p={3}>
        <Alert severity="warning">
          No tracking information available for this order.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Track Order {data.orderNumber}
        </Typography>
        <Button
          variant={isLiveTracking ? 'contained' : 'outlined'}
          onClick={toggleLiveTracking}
          startIcon={<DeliveryIcon />}
        >
          {isLiveTracking ? 'Stop Live Tracking' : 'Start Live Tracking'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Map Placeholder */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box textAlign="center">
              <LocationIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" mb={1}>
                Map Integration
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This would integrate with Google Maps, Mapbox, or similar service
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Current Location: {data.currentLocation.address}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Coordinates: {data.currentLocation.lat.toFixed(6)}, {data.currentLocation.lng.toFixed(6)}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Tracking Info */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={2}>
            {/* Order Status */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Order Status
                  </Typography>
                  <Chip
                    label={data.status.replace('_', ' ')}
                    color="primary"
                    size="medium"
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Order: {data.orderNumber}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Driver Info */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Driver Information
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <DeliveryIcon color="primary" />
                    <Typography variant="body1" fontWeight="bold">
                      {data.driver.name}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <PhoneIcon color="action" />
                    <Typography variant="body2">
                      {data.driver.phone}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <VehicleIcon color="action" />
                    <Typography variant="body2">
                      {data.driver.vehicle}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* ETA */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Estimated Arrival
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <ScheduleIcon color="primary" />
                    <Typography variant="body1" fontWeight="bold">
                      {new Date(data.estimatedArrival).toLocaleTimeString()}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    {new Date(data.estimatedArrival).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Live Tracking Info */}
            {isLiveTracking && liveLocation && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Live Updates
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Speed: {liveLocation.speed} mph
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Heading: {liveLocation.heading}°
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Updated: {new Date(liveLocation.timestamp).toLocaleTimeString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Grid>

        {/* Route History */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Route History
            </Typography>
            <Grid container spacing={2}>
              {data.route.map((point, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" fontWeight="bold">
                        Point {index + 1}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(point.timestamp).toLocaleTimeString()}
                      </Typography>
                      <Typography variant="body2" mt={1}>
                        {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TrackingMap;
