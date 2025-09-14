import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, List, ListItem, ListItemText, Alert } from '@mui/material';
import { BugReport as BugReportIcon, Refresh as RefreshIcon, Warning as WarningIcon } from '@mui/icons-material';
import googleMapsManager from '@/utils/googleMapsManager';

const GoogleMapsDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isVisible, setIsVisible] = useState(false);

  const updateDebugInfo = () => {
    const info = {
      timestamp: new Date().toISOString(),
      managerState: googleMapsManager.getState(),
      globalGuardState: googleMapsManager.getGlobalGuardState(),
      windowGoogle: !!window.google,
      windowGoogleMaps: !!window.google?.maps,
      windowGoogleMapsMap: !!window.google?.maps?.Map,
      existingScripts: document.querySelectorAll('script[src*="maps.googleapis.com"]').length,
      existingCallbacks: Object.keys(window).filter(key => /^googleMapsCallback_/.test(key)).length,
      allScripts: Array.from(document.querySelectorAll('script')).map(s => s.src).filter(src => src.includes('maps.googleapis.com')),
      hasConflicts: document.querySelectorAll('script[src*="maps.googleapis.com"]').length > 1
    };
    setDebugInfo(info);
  };

  useEffect(() => {
    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleDebugScripts = () => {
    googleMapsManager.debugExistingScripts();
    updateDebugInfo();
  };

  const handleForceReload = () => {
    googleMapsManager.forceReload();
    updateDebugInfo();
  };

  if (!isVisible) {
    return (
      <Button
        variant="outlined"
        startIcon={<BugReportIcon />}
        onClick={() => setIsVisible(true)}
        size="small"
        sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}
      >
        Debug Maps
      </Button>
    );
  }

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 450,
        maxHeight: 700,
        overflow: 'auto',
        zIndex: 9999,
        p: 2
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Google Maps Debug
        </Typography>
        <Button size="small" onClick={() => setIsVisible(false)}>
          ×
        </Button>
      </Box>

      {debugInfo.hasConflicts && (
        <Alert severity="warning" sx={{ mb: 2 }} icon={<WarningIcon />}>
          Multiple Google Maps scripts detected! This will cause errors.
        </Alert>
      )}

      <Box mb={2}>
        <Button
          variant="outlined"
          size="small"
          onClick={handleDebugScripts}
          sx={{ mr: 1 }}
        >
          Debug Scripts
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={handleForceReload}
          color="warning"
        >
          Force Reload
        </Button>
      </Box>

      <List dense>
        <ListItem>
          <ListItemText
            primary="Manager State"
            secondary={JSON.stringify(debugInfo.managerState, null, 2)}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Global Guard State"
            secondary={JSON.stringify(debugInfo.globalGuardState, null, 2)}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Window Google"
            secondary={debugInfo.windowGoogle ? '✅ Available' : '❌ Not Available'}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Window Google Maps"
            secondary={debugInfo.windowGoogleMaps ? '✅ Available' : '❌ Not Available'}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Window Google Maps Map"
            secondary={debugInfo.windowGoogleMapsMap ? '✅ Available' : '❌ Not Available'}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Existing Scripts"
            secondary={debugInfo.existingScripts}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Existing Callbacks"
            secondary={debugInfo.existingCallbacks}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Script URLs"
            secondary={debugInfo.allScripts?.join(', ') || 'None'}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Last Updated"
            secondary={debugInfo.timestamp}
          />
        </ListItem>
      </List>

      <Button
        variant="contained"
        startIcon={<RefreshIcon />}
        onClick={updateDebugInfo}
        fullWidth
        size="small"
      >
        Refresh Debug Info
      </Button>
    </Paper>
  );
};

export default GoogleMapsDebugger;
