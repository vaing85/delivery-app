import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Paper, CircularProgress, Button } from '@mui/material';
import { useGoogleMaps } from '@/utils/useGoogleMaps';

interface GoogleTrackingMapProps {
  orderId: string;
}

const GoogleTrackingMapSimple: React.FC<GoogleTrackingMapProps> = ({ orderId }) => {
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const isMountedRef = useRef(true);
  const mapInitAttemptedRef = useRef(false);
  
  // Use the custom hook for Google Maps loading
  const { isLoaded: mapsLoaded, isLoading: mapsLoading, error: mapsError, retry: retryMaps } = useGoogleMaps();

  const initMap = useCallback(async () => {
    // Prevent multiple initialization attempts
    if (mapInitAttemptedRef.current) {
      console.log('⚠️ SimpleMap: Map initialization already attempted, skipping');
      return;
    }

    try {
      // Double-check that the ref is still valid and component is mounted
      if (!mapRef.current || !isMountedRef.current) {
        console.log('⚠️ SimpleMap: Ref is null or component unmounted, skipping map creation');
        return;
      }

      // Check if Google Maps is available
      if (!window.google?.maps?.Map) {
        console.error('❌ SimpleMap: Google Maps not available');
        setMapError('Google Maps not available');
        setIsMapLoading(false);
        return;
      }

      console.log('🗺️ SimpleMap: Creating map...');
      mapInitAttemptedRef.current = true;
      
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 40.7128, lng: -74.0060 },
        zoom: 10,
        mapTypeId: 'roadmap',
        // Minimal UI to prevent conflicts
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: 'cooperative'
      });

      console.log('✅ SimpleMap: Map created successfully:', map);
      mapInstanceRef.current = map;
      setIsMapLoading(false);
    } catch (error) {
      console.error('❌ SimpleMap: Failed to create map:', error);
      setMapError('Failed to initialize Google Maps');
      setIsMapLoading(false);
      mapInitAttemptedRef.current = false; // Allow retry
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current) {
      console.log('🔍 SimpleMap: Missing ref');
      return;
    }

    console.log('🎯 SimpleMap: Starting map initialization...');

    let timeoutId: NodeJS.Timeout;

    const loadMap = async () => {
      try {
        // Reset loading state
        setIsMapLoading(true);
        setMapError(null);
        
        // Wait for Google Maps to be loaded
        if (!mapsLoaded) {
          console.log('⏳ SimpleMap: Waiting for Google Maps to load...');
          return;
        }
        
        if (!isMountedRef.current) return;
        
        // Small delay to ensure DOM is fully ready
        timeoutId = setTimeout(() => {
          if (isMountedRef.current && mapRef.current) {
            initMap();
          }
        }, 300);
      } catch (error) {
        if (isMountedRef.current) {
          console.error('❌ SimpleMap: Failed to load Google Maps:', error);
          setMapError('Failed to load Google Maps');
          setIsMapLoading(false);
        }
      }
    };

    loadMap();

    // Cleanup function
    return () => {
      console.log('🧹 SimpleMap: Cleaning up...');
      isMountedRef.current = false;
      
      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Clean up map instance if it exists
      if (mapInstanceRef.current) {
        try {
          // Don't try to remove the map from DOM, just clear the reference
          mapInstanceRef.current = null;
        } catch (error) {
          console.warn('⚠️ SimpleMap: Error during cleanup:', error);
        }
      }
    };
  }, [mapsLoaded, initMap]); // Add mapsLoaded as dependency

  // Handle Google Maps loading errors
  useEffect(() => {
    if (mapsError) {
      setMapError(mapsError);
      setIsMapLoading(false);
    }
  }, [mapsError]);

  // Add error boundary for Google Maps errors
  if (mapError) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" color="error" gutterBottom>
          Map Error
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {mapError}
        </Typography>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => {
            setMapError(null);
            setIsMapLoading(true);
            mapInitAttemptedRef.current = false; // Reset initialization flag
            // Force a complete re-initialization
            mapInstanceRef.current = null;
            retryMaps();
            setTimeout(() => {
              if (mapRef.current && isMountedRef.current) {
                initMap();
              }
            }, 500);
          }}
          sx={{ mt: 1 }}
        >
          Retry
        </Button>
      </Paper>
    );
  }

  if (!mapsLoaded && mapsLoading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
          <CircularProgress size={24} />
          <Typography variant="body2">
            Loading Google Maps...
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 0, overflow: 'hidden' }}>
      <Box
        key={`map-${orderId}`} // Stable key to prevent unnecessary re-renders
        ref={mapRef}
        sx={{
          width: '100%',
          height: 400,
          position: 'relative',
          backgroundColor: '#f0f0f0',
          minHeight: 400 // Ensure minimum height
        }}
        id={`map-container-${orderId}`} // Unique ID for debugging
      >
        {isMapLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: 2,
              borderRadius: 1
            }}
          >
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              Initializing Map...
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
              zIndex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: 2,
              borderRadius: 1,
              textAlign: 'center'
            }}
          >
            <Typography color="error" variant="body2">
              {mapError}
            </Typography>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => window.location.reload()}
              sx={{ mt: 1 }}
            >
              Reload Page
            </Button>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default GoogleTrackingMapSimple;
