import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Alert, Divider, Chip } from '@mui/material';
import { Info as InfoIcon, CheckCircle as CheckIcon, Error as ErrorIcon } from '@mui/icons-material';
import { MAPS_CONFIG } from '@/config/maps';

const GoogleMapsDebug: React.FC = () => {
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'valid' | 'invalid' | 'error'>('checking');
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [testResults, setTestResults] = useState<any>({});

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = () => {
    const apiKey = MAPS_CONFIG.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      setApiKeyStatus('invalid');
      setErrorDetails('API key is not configured or is using placeholder value');
      return;
    }

    // Test if the API key is valid by trying to load Google Maps
    testGoogleMapsApi(apiKey);
  };

  const testGoogleMapsApi = async (apiKey: string) => {
    try {
      // Test 1: Check if Google Maps script can be loaded
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      
      script.onload = () => {
        setApiKeyStatus('valid');
        setTestResults((prev: any) => ({ ...prev, scriptLoaded: true }));
      };
      
      script.onerror = () => {
        setApiKeyStatus('error');
        setErrorDetails('Failed to load Google Maps script');
      };

      document.head.appendChild(script);

      // Test 2: Check if we can create a map instance
      setTimeout(() => {
        if (window.google && window.google.maps) {
          try {
            const testMap = new window.google.maps.Map(document.createElement('div'), {
              center: { lat: 0, lng: 0 },
              zoom: 1
            });
            setTestResults((prev: any) => ({ ...prev, mapCreated: true }));
          } catch (mapError) {
            setTestResults((prev: any) => ({ ...prev, mapCreated: false, mapError: (mapError as Error).message }));
          }
        }
      }, 2000);

    } catch (error) {
      setApiKeyStatus('error');
      setErrorDetails(`Error testing API: ${error}`);
    }
  };

  const getStatusIcon = () => {
    switch (apiKeyStatus) {
      case 'valid': return <CheckIcon color="success" />;
      case 'invalid': return <ErrorIcon color="error" />;
      case 'error': return <ErrorIcon color="error" />;
      default: return <InfoIcon color="info" />;
    }
  };

  const getStatusColor = () => {
    switch (apiKeyStatus) {
      case 'valid': return 'success';
      case 'invalid': return 'error';
      case 'error': return 'error';
      default: return 'info';
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        🗺️ Google Maps Debug Test
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          API Key Status
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          {getStatusIcon()}
          <Chip 
            label={apiKeyStatus.toUpperCase()} 
            color={getStatusColor() as any}
            variant="outlined"
          />
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          <strong>API Key:</strong> {MAPS_CONFIG.GOOGLE_MAPS_API_KEY.substring(0, 20)}...
        </Typography>

        {apiKeyStatus === 'invalid' && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <strong>Issue:</strong> {errorDetails}
          </Alert>
        )}

        {apiKeyStatus === 'error' && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <strong>Error:</strong> {errorDetails}
          </Alert>
        )}

        {apiKeyStatus === 'valid' && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <strong>Success:</strong> Google Maps API key is working correctly!
          </Alert>
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Results
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography>Script Loaded:</Typography>
            <Chip 
              label={testResults.scriptLoaded ? '✅ Yes' : '❌ No'} 
              color={testResults.scriptLoaded ? 'success' : 'error'}
              size="small"
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography>Map Created:</Typography>
            <Chip 
              label={testResults.mapCreated ? '✅ Yes' : '❌ No'} 
              color={testResults.mapCreated ? 'success' : 'error'}
              size="small"
            />
          </Box>
          
          {testResults.mapError && (
            <Typography variant="body2" color="error">
              Map Error: {testResults.mapError}
            </Typography>
          )}
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Environment Variables
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">VITE_GOOGLE_MAPS_API_KEY:</Typography>
            <Typography variant="body2" color="text.secondary">
              {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? '✅ Set' : '❌ Not Set'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">VITE_API_URL:</Typography>
            <Typography variant="body2" color="text.secondary">
              {import.meta.env.VITE_API_URL || '❌ Not Set'}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Troubleshooting Steps
        </Typography>
        
        <Box component="ol" sx={{ pl: 2 }}>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            <strong>Check .env file:</strong> Make sure VITE_GOOGLE_MAPS_API_KEY is set
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            <strong>Restart dev server:</strong> Environment variables require server restart
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            <strong>Verify API key:</strong> Check if it's enabled in Google Cloud Console
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            <strong>Enable Maps JavaScript API:</strong> Make sure the API is enabled in your project
          </Typography>
        </Box>
      </Paper>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button 
          variant="contained" 
          onClick={checkApiKey}
          sx={{ mr: 2 }}
        >
          Re-run Tests
        </Button>
        
        <Button 
          variant="outlined" 
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </Button>
      </Box>
    </Box>
  );
};

export default GoogleMapsDebug;
