import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  LocalShipping as DeliveryIcon,
  Phone as PhoneIcon,
  DirectionsCar as VehicleIcon,
  Schedule as ScheduleIcon,
  MyLocation as MyLocationIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { MAPS_CONFIG } from '@/config/maps';
import FallbackMap from './FallbackMap';

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

interface GoogleTrackingMapProps {
  orderId: string;
}

const GoogleTrackingMap: React.FC<GoogleTrackingMapProps> = ({ orderId }) => {
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  // Callback ref to initialize map when DOM element is available
  const setMapRef = useCallback((node: HTMLDivElement | null) => {
    if (node && !mapInstance && MAPS_CONFIG.GOOGLE_MAPS_API_KEY) {
      console.log('🎯 GoogleTrackingMap: DOM element available, initializing map...', new Date().toISOString());
      
      const initMap = () => {
        try {
          console.log('🗺️ GoogleTrackingMap: Initializing map...', new Date().toISOString());
          console.log('🔍 GoogleTrackingMap: window.google:', window.google);
          console.log('🔍 GoogleTrackingMap: window.google.maps:', window.google?.maps);
          
          const map = new google.maps.Map(node, {
            center: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
            zoom: 10,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: false,
            zoomControl: true,
            styles: MAPS_CONFIG.MAP_STYLES
          });

          console.log('✅ GoogleTrackingMap: Map initialized successfully:', map, new Date().toISOString());
          setMapInstance(map);
          setIsMapLoading(false);
        } catch (error) {
          console.error('❌ GoogleTrackingMap: Failed to initialize map:', error);
          setMapError('Failed to initialize Google Maps');
          setIsMapLoading(false);
        }
      };

      // Check if Google Maps is loaded
      if (window.google && window.google.maps) {
        console.log('✅ GoogleTrackingMap: Google Maps already loaded, initializing...', new Date().toISOString());
        initMap();
      } else {
        console.log('📜 GoogleTrackingMap: Google Maps not loaded, loading script...', new Date().toISOString());
        // Load Google Maps script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_CONFIG.GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          console.log('📜 GoogleTrackingMap: Google Maps script loaded successfully', new Date().toISOString());
          console.log('🔍 GoogleTrackingMap: window.google after script load:', window.google);
          console.log('🔍 GoogleTrackingMap: window.google.maps after script load:', window.google?.maps);
          initMap();
        };
        
        script.onerror = (error) => {
          console.error('❌ GoogleTrackingMap: Failed to load Google Maps script:', error);
          setMapError('Failed to load Google Maps script');
          setIsMapLoading(false);
        };

        document.head.appendChild(script);
        console.log('📜 GoogleTrackingMap: Script element added to document.head', new Date().toISOString());
      }
    }
  }, [mapInstance]);

  // Fetch tracking data
  const { data: trackingData, isLoading, error } = useQuery({
    queryKey: ['tracking', orderId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:5000/api/tracking/${orderId}`);
      return response.json();
    },
    refetchInterval: isLiveTracking ? 10000 : false,
  });

  // Live tracking data
  const { data: liveData } = useQuery({
    queryKey: ['live-tracking', orderId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:5000/api/tracking/${orderId}/live`);
      return response.json();
    },
    enabled: isLiveTracking,
    refetchInterval: isLiveTracking ? 5000 : false,
  });

  // Map initialization is now handled by the callback ref (setMapRef)

  const toggleLiveTracking = () => {
    setIsLiveTracking(!isLiveTracking);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const centerOnDriver = useCallback(() => {
    if (mapInstance && trackingData?.data?.currentLocation) {
      const { lat, lng } = trackingData.data.currentLocation;
      mapInstance.setCenter({ lat, lng });
      mapInstance.setZoom(15);
    }
  }, [mapInstance, trackingData]);

  const zoomIn = useCallback(() => {
    if (mapInstance) {
      mapInstance.setZoom((mapInstance.getZoom() || 10) + 1);
    }
  }, [mapInstance]);

  const zoomOut = useCallback(() => {
    if (mapInstance) {
      mapInstance.setZoom((mapInstance.getZoom() || 10) - 1);
    }
  }, [mapInstance]);

  // Update map when tracking data changes
  useEffect(() => {
    if (!mapInstance || !trackingData?.data) return;

    const data = trackingData.data;
    console.log('📍 GoogleTrackingMap: Updating map with tracking data:', data);
    
    // Clear existing markers and polyline
    markers.forEach(marker => marker.setMap(null));
    if (polyline) polyline.setMap(null);

    const newMarkers: google.maps.Marker[] = [];
    
    // Add pickup location marker
    const pickupMarker = new google.maps.Marker({
      position: { lat: data.pickupLocation.lat, lng: data.pickupLocation.lng },
      map: mapInstance,
      title: 'Pickup Location',
      label: 'P',
      icon: {
        url: MAPS_CONFIG.MARKER_ICONS.pickup,
        scaledSize: new google.maps.Size(32, 32)
      }
    });
    newMarkers.push(pickupMarker);

    // Add delivery location marker
    const deliveryMarker = new google.maps.Marker({
      position: { lat: data.deliveryLocation.lat, lng: data.deliveryLocation.lng },
      map: mapInstance,
      title: 'Delivery Location',
      label: 'D',
      icon: {
        url: MAPS_CONFIG.MARKER_ICONS.delivery,
        scaledSize: new google.maps.Size(32, 32)
      }
    });
    newMarkers.push(deliveryMarker);

    // Add driver location marker
    const driverMarker = new google.maps.Marker({
      position: { lat: data.currentLocation.lat, lng: data.currentLocation.lng },
      map: mapInstance,
      title: 'Driver Location',
      label: '🚚',
      icon: {
        url: MAPS_CONFIG.MARKER_ICONS.driver,
        scaledSize: new google.maps.Size(32, 32)
      }
    });
    newMarkers.push(driverMarker);

    // Create route polyline
    if (data.route && data.route.length > 1) {
      const path = data.route.map(point => ({ lat: point.lat, lng: point.lng }));
      const routePolyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#2196F3',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: mapInstance
      });
      setPolyline(routePolyline);
    }

    setMarkers(newMarkers);

    // Fit bounds to show all markers
    const bounds = new google.maps.LatLngBounds();
    newMarkers.forEach(marker => bounds.extend(marker.getPosition()!));
    mapInstance.fitBounds(bounds);

    console.log('✅ GoogleTrackingMap: Map updated with markers and route');

  }, [mapInstance, trackingData, markers, polyline]);

  // Update driver marker position for live tracking
  useEffect(() => {
    if (!mapInstance || !liveData?.data || !markers[2]) return;

    const liveLocation = liveData.data.location;
    const driverMarker = markers[2];
    
    // Smoothly animate marker movement
    const newPosition = new google.maps.LatLng(liveLocation.lat, liveLocation.lng);
    driverMarker.setPosition(newPosition);
    
    // Update marker title with live info
    driverMarker.setTitle(`Driver - Speed: ${liveData.data.speed} mph, Heading: ${liveData.data.heading}°`);

  }, [mapInstance, liveData, markers]);

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

  // Check if Google Maps API key is configured
  if (!MAPS_CONFIG.GOOGLE_MAPS_API_KEY || MAPS_CONFIG.GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
    console.log('❌ GoogleTrackingMap: API key not configured, showing FallbackMap');
    return (
      <FallbackMap
        orderId={orderId}
        pickupAddress={data.pickupLocation.address}
        deliveryAddress={data.deliveryLocation.address}
        driverLocation={data.currentLocation.address}
      />
    );
  }

  console.log('✅ GoogleTrackingMap: API key configured, showing real map', new Date().toISOString());
  console.log('📊 GoogleTrackingMap: trackingData:', trackingData);
  console.log('🗺️ GoogleTrackingMap: mapInstance:', mapInstance);
  console.log('🔄 GoogleTrackingMap: isMapLoading:', isMapLoading);

  return (
    <Box sx={{ height: isFullscreen ? '100vh' : 'auto', overflow: 'hidden' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Track Order {data.orderNumber}
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant={isLiveTracking ? 'contained' : 'outlined'}
            onClick={toggleLiveTracking}
            startIcon={<DeliveryIcon />}
          >
            {isLiveTracking ? 'Stop Live Tracking' : 'Start Live Tracking'}
          </Button>
          <Tooltip title="Center on Driver">
            <IconButton onClick={centerOnDriver} color="primary">
              <MyLocationIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom In">
            <IconButton onClick={zoomIn} color="primary">
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <IconButton onClick={zoomOut} color="primary">
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            <IconButton onClick={toggleFullscreen} color="primary">
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Google Maps */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 0, overflow: 'hidden' }}>
                         <Box
               ref={setMapRef}
               sx={{
                 width: '100%',
                 height: isFullscreen ? '100vh' : 400,
                 position: 'relative',
                 backgroundColor: '#f0f0f0'
               }}
             >
              {isMapLoading && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1
                  }}
                >
                  <CircularProgress />
                  <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                    Loading Google Maps...
                  </Typography>
                </Box>
              )}
              
              {mapError && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1
                  }}
                >
                  <Alert severity="error">
                    {mapError}
                  </Alert>
                </Box>
              )}
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

export default GoogleTrackingMap;
