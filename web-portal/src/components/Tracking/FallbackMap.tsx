import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Link
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Map as MapIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface FallbackMapProps {
  orderId: string;
  pickupAddress: string;
  deliveryAddress: string;
  driverLocation: string;
}

const FallbackMap: React.FC<FallbackMapProps> = ({
  orderId,
  pickupAddress,
  deliveryAddress,
  driverLocation
}) => {
  return (
    <Box>
      {/* Setup Alert */}
      <Alert 
        severity="info" 
        icon={<InfoIcon />}
        sx={{ mb: 2 }}
        action={
          <Button 
            color="inherit" 
            size="small"
            component={Link}
            href="GOOGLE_MAPS_SETUP.md"
            target="_blank"
          >
            Setup Guide
          </Button>
        }
      >
        Google Maps integration is not configured. Follow the setup guide to enable real-time tracking maps.
      </Alert>

      {/* Map Placeholder */}
      <Paper 
        sx={{ 
          p: 4, 
          height: 400, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          textAlign: 'center'
        }}
      >
        <MapIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" color="primary" gutterBottom>
          Map Integration Required
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          Enable Google Maps to see real-time delivery tracking
        </Typography>
        
        {/* Location Information */}
        <Box sx={{ width: '100%', maxWidth: 600 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Box sx={{ flex: 1, textAlign: 'left' }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                📍 Pickup Location
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {pickupAddress}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, textAlign: 'left' }}>
              <Typography variant="subtitle2" color="error" gutterBottom>
                🎯 Delivery Location
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {deliveryAddress}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="subtitle2" color="info.main" gutterBottom>
              🚚 Driver Location
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {driverLocation}
            </Typography>
          </Box>
        </Box>

        {/* Setup Button */}
        <Button
          variant="contained"
          size="large"
          startIcon={<LocationIcon />}
          sx={{ mt: 3 }}
          component={Link}
          href="GOOGLE_MAPS_SETUP.md"
          target="_blank"
        >
          Setup Google Maps
        </Button>
      </Paper>

      {/* Quick Setup Instructions */}
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Quick Setup Steps
        </Typography>
        <Box component="ol" sx={{ pl: 2 }}>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            Get API key from <Link href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</Link>
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            Add <code>VITE_GOOGLE_MAPS_API_KEY=your_key_here</code> to your .env file
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            Restart your development server
          </Typography>
          <Typography component="li" variant="body2">
            Enjoy real-time tracking maps! 🗺️
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default FallbackMap;
