import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Paper, Typography, Button, IconButton, Tooltip } from '@mui/material';
import {
  MyLocation as MyLocationIcon,
  Navigation as NavigationIcon,
  Route as RouteIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';

interface GoogleMapComponentProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    id: string;
    position: { lat: number; lng: number };
    title?: string;
    icon?: string;
    draggable?: boolean;
    onClick?: () => void;
  }>;
  routes?: Array<{
    id: string;
    path: Array<{ lat: number; lng: number }>;
    color?: string;
    strokeWeight?: number;
  }>;
  onMapClick?: (event: { lat: number; lng: number }) => void;
  onMarkerClick?: (markerId: string) => void;
  onMarkerDrag?: (markerId: string, position: { lat: number; lng: number }) => void;
  height?: string | number;
  width?: string | number;
  showControls?: boolean;
  showCurrentLocation?: boolean;
  showFullscreen?: boolean;
  className?: string;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  center = { lat: 40.7128, lng: -74.0060 }, // Default to NYC
  zoom = 13,
  markers = [],
  routes = [],
  onMapClick,
  onMarkerClick,
  onMarkerDrag,
  height = 400,
  width = '100%',
  showControls = true,
  showCurrentLocation = true,
  showFullscreen = true,
  className
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const routesRef = useRef<Map<string, any>>(new Map());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsGoogleMapsLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&libraries=geometry,places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsGoogleMapsLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
      };
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isGoogleMapsLoaded || !mapRef.current) return;

    const mapOptions = {
      center: new window.google.maps.LatLng(center.lat, center.lng),
      zoom: zoom,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: false,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    };

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);

    // Add click listener
    if (onMapClick) {
      mapInstanceRef.current.addListener('click', (event: any) => {
        onMapClick({
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        });
      });
    }

    // Get current location
    if (showCurrentLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          mapInstanceRef.current.setCenter(location);
        },
        (error) => {
          console.error('Error getting current location:', error);
        }
      );
    }
  }, [isGoogleMapsLoaded, center, zoom, onMapClick, showCurrentLocation]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !isGoogleMapsLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current.clear();

    // Add new markers
    markers.forEach(markerData => {
      const marker = new window.google.maps.Marker({
        position: new window.google.maps.LatLng(markerData.position.lat, markerData.position.lng),
        map: mapInstanceRef.current,
        title: markerData.title,
        icon: markerData.icon,
        draggable: markerData.draggable || false
      });

      // Add click listener
      if (onMarkerClick) {
        marker.addListener('click', () => {
          onMarkerClick(markerData.id);
        });
      }

      // Add drag listener
      if (onMarkerDrag && markerData.draggable) {
        marker.addListener('dragend', () => {
          const position = marker.getPosition();
          onMarkerDrag(markerData.id, {
            lat: position.lat(),
            lng: position.lng()
          });
        });
      }

      markersRef.current.set(markerData.id, marker);
    });
  }, [markers, onMarkerClick, onMarkerDrag, isGoogleMapsLoaded]);

  // Update routes
  useEffect(() => {
    if (!mapInstanceRef.current || !isGoogleMapsLoaded) return;

    // Clear existing routes
    routesRef.current.forEach(route => route.setMap(null));
    routesRef.current.clear();

    // Add new routes
    routes.forEach(routeData => {
      const path = routeData.path.map(point => 
        new window.google.maps.LatLng(point.lat, point.lng)
      );

      const polyline = new window.google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: routeData.color || '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: routeData.strokeWeight || 2,
        map: mapInstanceRef.current
      });

      routesRef.current.set(routeData.id, polyline);
    });
  }, [routes, isGoogleMapsLoaded]);

  // Map control functions
  const zoomIn = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + 1);
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() - 1);
    }
  }, []);

  const centerOnCurrentLocation = useCallback(() => {
    if (currentLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(currentLocation);
      mapInstanceRef.current.setZoom(15);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          mapInstanceRef.current.setCenter(location);
          mapInstanceRef.current.setZoom(15);
        },
        (error) => {
          console.error('Error getting current location:', error);
        }
      );
    }
  }, [currentLocation]);

  const toggleFullscreen = useCallback(() => {
    if (!mapRef.current) return;

    if (!isFullscreen) {
      if (mapRef.current.requestFullscreen) {
        mapRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (!isGoogleMapsLoaded) {
    return (
      <Paper
        sx={{
          height,
          width,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5'
        }}
        className={className}
      >
        <Box textAlign="center">
          <Typography variant="h6" gutterBottom>
            Loading Google Maps...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while the map loads
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Box position="relative" className={className}>
      <div
        ref={mapRef}
        style={{
          height: isFullscreen ? '100vh' : height,
          width: isFullscreen ? '100vw' : width,
          borderRadius: isFullscreen ? 0 : 8
        }}
      />
      
      {showControls && (
        <Box
          position="absolute"
          top={16}
          right={16}
          display="flex"
          flexDirection="column"
          gap={1}
        >
          {showCurrentLocation && (
            <Tooltip title="Center on current location">
              <IconButton
                onClick={centerOnCurrentLocation}
                sx={{
                  backgroundColor: 'white',
                  boxShadow: 2,
                  '&:hover': { backgroundColor: 'grey.50' }
                }}
              >
                <MyLocationIcon />
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title="Zoom in">
            <IconButton
              onClick={zoomIn}
              sx={{
                backgroundColor: 'white',
                boxShadow: 2,
                '&:hover': { backgroundColor: 'grey.50' }
              }}
            >
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Zoom out">
            <IconButton
              onClick={zoomOut}
              sx={{
                backgroundColor: 'white',
                boxShadow: 2,
                '&:hover': { backgroundColor: 'grey.50' }
              }}
            >
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          
          {showFullscreen && (
            <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
              <IconButton
                onClick={toggleFullscreen}
                sx={{
                  backgroundColor: 'white',
                  boxShadow: 2,
                  '&:hover': { backgroundColor: 'grey.50' }
                }}
              >
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}
    </Box>
  );
};

export default GoogleMapComponent;
