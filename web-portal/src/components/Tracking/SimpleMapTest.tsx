import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { MAPS_CONFIG } from '@/config/maps';

const SimpleMapTest: React.FC = () => {
  const renderMap = (status: Status) => {
    switch (status) {
      case Status.LOADING:
        return <Typography>Loading Google Maps...</Typography>;
      case Status.FAILURE:
        return <Typography color="error">Failed to load Google Maps</Typography>;
      default:
        return (
          <Box
            sx={{
              width: '100%',
              height: 400,
              backgroundColor: '#f0f0f0',
              border: '2px solid #ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography variant="h6" color="primary">
              🗺️ Google Maps Loaded Successfully!
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Typography variant="h5" gutterBottom>
        Simple Map Test
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        API Key: {MAPS_CONFIG.GOOGLE_MAPS_API_KEY.substring(0, 20)}...
      </Typography>
      
      <Wrapper 
        apiKey={MAPS_CONFIG.GOOGLE_MAPS_API_KEY} 
        render={renderMap}
      />
    </Paper>
  );
};

export default SimpleMapTest;
