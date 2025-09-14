import React, { useState, useEffect } from 'react';
import {
  Box,
  Alert,
  AlertTitle,
  Button,
  Snackbar,
  Chip,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  WifiOff,
  Sync,
  CloudOff,
  CheckCircle,
  Error,
  Refresh,
} from '@mui/icons-material';
import { useOffline } from '@/services/offlineService';

interface OfflineIndicatorProps {
  showSnackbar?: boolean;
  showChip?: boolean;
  position?: 'top' | 'bottom';
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showSnackbar = true,
  showChip = true,
  position = 'top',
}) => {
  const {
    isOffline,
    pendingActionsCount,
    pendingActions,
    forceSync,
    clearPendingActions,
  } = useOffline();

  const [showAlert, setShowAlert] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (isOffline) {
      setShowAlert(true);
    } else {
      setShowAlert(false);
      setLastSyncTime(new Date());
    }
  }, [isOffline]);

  const handleSync = async () => {
    setSyncStatus('syncing');
    try {
      await forceSync();
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (error) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleClearPending = () => {
    clearPendingActions();
  };

  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <Refresh className="animate-spin" />;
      case 'success':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      default:
        return <Sync />;
    }
  };

  const getSyncColor = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'primary';
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  if (!isOffline && pendingActionsCount === 0) {
    return null;
  }

  return (
    <>
      {/* Chip indicator */}
      {showChip && (
        <Box
          sx={{
            position: 'fixed',
            [position]: 16,
            right: 16,
            zIndex: 9999,
            display: 'flex',
            gap: 1,
            alignItems: 'center',
          }}
        >
          {isOffline && (
            <Chip
              icon={<WifiOff />}
              label="Offline"
              color="error"
              variant="filled"
              size="small"
            />
          )}
          
          {pendingActionsCount > 0 && (
            <Tooltip title={`${pendingActionsCount} pending actions`}>
              <Chip
                icon={<CloudOff />}
                label={`${pendingActionsCount} pending`}
                color="warning"
                variant="filled"
                size="small"
                onClick={handleSync}
              />
            </Tooltip>
          )}

          {!isOffline && pendingActionsCount > 0 && (
            <Tooltip title="Sync pending actions">
              <IconButton
                size="small"
                color={getSyncColor()}
                onClick={handleSync}
                disabled={syncStatus === 'syncing'}
              >
                {getSyncIcon()}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}

      {/* Snackbar alert */}
      {showSnackbar && (
        <Snackbar
          open={showAlert}
          anchorOrigin={{
            vertical: position,
            horizontal: 'center',
          }}
          autoHideDuration={isOffline ? null : 4000}
          onClose={() => setShowAlert(false)}
        >
          <Alert
            severity={isOffline ? 'error' : 'warning'}
            onClose={() => setShowAlert(false)}
            action={
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {pendingActionsCount > 0 && (
                  <Button
                    size="small"
                    color="inherit"
                    onClick={handleSync}
                    disabled={syncStatus === 'syncing'}
                    startIcon={getSyncIcon()}
                  >
                    Sync ({pendingActionsCount})
                  </Button>
                )}
                
                {pendingActionsCount > 0 && (
                  <Button
                    size="small"
                    color="inherit"
                    onClick={handleClearPending}
                  >
                    Clear
                  </Button>
                )}
              </Box>
            }
            sx={{ minWidth: 300 }}
          >
            <AlertTitle>
              {isOffline ? 'You are offline' : 'Connection restored'}
            </AlertTitle>
            
            {isOffline ? (
              'Some features may be limited. Your actions will be synced when you reconnect.'
            ) : (
              <>
                {pendingActionsCount > 0
                  ? `${pendingActionsCount} actions are pending sync.`
                  : 'All actions have been synced successfully.'}
                {lastSyncTime && (
                  <Box component="div" sx={{ fontSize: '0.75rem', mt: 0.5 }}>
                    Last sync: {lastSyncTime.toLocaleTimeString()}
                  </Box>
                )}
              </>
            )}
          </Alert>
        </Snackbar>
      )}
    </>
  );
};

export default OfflineIndicator;
