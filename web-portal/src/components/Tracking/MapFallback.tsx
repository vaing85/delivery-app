import React from 'react';
import { Box, Typography, Paper, Alert, Button } from '@mui/material';
import { LocationOn as LocationIcon, Refresh as RefreshIcon } from '@mui/icons-material';

interface MapFallbackProps {
  error?: string;
  onRetry?: () => void;
  orderId?: string;
}

const MapFallback: React.FC<MapFallbackProps> = ({ error, onRetry, orderId }) => {
  const isApiKeyMissing = error?.includes('API key not configured') || 
                         error?.includes('Google Maps API key not configured');

  return (
    <Paper 
      sx={{ 
        p: 3, 
        textAlign: 'center',
        backgroundColor: '#f5f5f5',
        border: '2px dashed #ccc'
      }}
    >
      <LocationIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
      
      {isApiKeyMissing ? (
        <Box>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Map Not Available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Google Maps integration is not configured. Please contact your administrator.
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            To enable map tracking, a Google Maps API key needs to be configured.
          </Alert>
        </Box>
      ) : (
        <Box>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Map Loading Failed
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {error || 'Unable to load the map. Please try again.'}
          </Typography>
          {onRetry && (
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
              sx={{ mt: 1 }}
            >
              Retry
            </Button>
          )}
        </Box>
      )}
      
      {orderId && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Order ID: {orderId}
        </Typography>
      )}
    </Paper>
  );
};

export default MapFallback;
