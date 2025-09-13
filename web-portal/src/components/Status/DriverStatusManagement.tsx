import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Switch,
  FormControlLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  OnlinePrediction as OnlineIcon,
  OfflineBolt as OfflineIcon,
  LocalShipping as DeliveryIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  BatteryFull as BatteryIcon,
  SignalWifi4Bar as WifiIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

interface DriverStatusManagementProps {
  driverId: string;
}

interface DriverStatus {
  isOnline: boolean;
  availability: 'available' | 'busy' | 'offline' | 'break';
  currentLocation: {
    lat: number;
    lng: number;
    accuracy: number;
    lastUpdated: Date;
  };
  vehicleInfo: {
    type: string;
    model: string;
    licensePlate: string;
    fuelLevel: number;
    batteryLevel?: number;
  };
  workingHours: {
    start: string;
    end: string;
    timezone: string;
  };
  breakSettings: {
    maxBreakDuration: number;
    breakReminderInterval: number;
  };
  performance: {
    totalHoursToday: number;
    deliveriesCompleted: number;
    averageRating: number;
    efficiency: number;
  };
}

interface StatusHistory {
  id: string;
  status: string;
  timestamp: Date;
  duration: number;
  location?: string;
}

const DriverStatusManagement: React.FC<DriverStatusManagementProps> = ({ driverId }) => {
  const [driverStatus, setDriverStatus] = useState<DriverStatus>({
    isOnline: false,
    availability: 'offline',
    currentLocation: {
      lat: 40.7128,
      lng: -74.0060,
      accuracy: 10,
      lastUpdated: new Date()
    },
    vehicleInfo: {
      type: 'Car',
      model: 'Toyota Camry',
      licensePlate: 'ABC-123',
      fuelLevel: 75,
      batteryLevel: 85
    },
    workingHours: {
      start: '08:00',
      end: '18:00',
      timezone: 'EST'
    },
    breakSettings: {
      maxBreakDuration: 30,
      breakReminderInterval: 4
    },
    performance: {
      totalHoursToday: 6.5,
      deliveriesCompleted: 12,
      averageRating: 4.7,
      efficiency: 87
    }
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showBreakDialog, setShowBreakDialog] = useState(false);
  const [breakDuration, setBreakDuration] = useState(15);
  const [breakReason, setBreakReason] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);

  // Mock status history
  useEffect(() => {
    const mockHistory: StatusHistory[] = [
      { id: '1', status: 'available', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), duration: 120, location: 'Downtown' },
      { id: '2', status: 'busy', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), duration: 45, location: 'Uptown' },
      { id: '3', status: 'break', timestamp: new Date(Date.now() - 30 * 60 * 1000), duration: 15, location: 'Coffee Shop' },
      { id: '4', status: 'available', timestamp: new Date(Date.now() - 15 * 60 * 1000), duration: 0, location: 'Current Location' },
    ];
    setStatusHistory(mockHistory);
  }, []);

  const handleOnlineToggle = () => {
    const newStatus = !driverStatus.isOnline;
    setDriverStatus(prev => ({
      ...prev,
      isOnline: newStatus,
      availability: newStatus ? 'available' : 'offline'
    }));
    
    setSnackbar({
      open: true,
      message: newStatus ? 'You are now online' : 'You are now offline',
      severity: newStatus ? 'success' : 'info'
    });
  };

  const handleAvailabilityChange = (newAvailability: DriverStatus['availability']) => {
    setDriverStatus(prev => ({ ...prev, availability: newAvailability }));
    
    const messages = {
      available: 'You are now available for deliveries',
      busy: 'You are marked as busy',
      offline: 'You are now offline',
      break: 'You are on break'
    };
    
    setSnackbar({
      open: true,
      message: messages[newAvailability],
      severity: newAvailability === 'available' ? 'success' : 'info'
    });
  };

  const handleStartBreak = () => {
    setDriverStatus(prev => ({ ...prev, availability: 'break' }));
    setShowBreakDialog(false);
    setSnackbar({
      open: true,
      message: `Break started for ${breakDuration} minutes`,
      severity: 'info'
    });
  };

  const handleEndBreak = () => {
    setDriverStatus(prev => ({ ...prev, availability: 'available' }));
    setSnackbar({
      open: true,
      message: 'Break ended, you are now available',
      severity: 'success'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success';
      case 'busy': return 'warning';
      case 'offline': return 'error';
      case 'break': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircleIcon color="success" />;
      case 'busy': return <WarningIcon color="warning" />;
      case 'offline': return <OfflineIcon color="error" />;
      case 'break': return <TimerIcon color="info" />;
      default: return <InfoIcon />;
    }
  };

  const getFuelColor = (level: number) => {
    if (level > 50) return 'success';
    if (level > 25) return 'warning';
    return 'error';
  };

  const getBatteryColor = (level: number) => {
    if (level > 80) return 'success';
    if (level > 50) return 'warning';
    if (level > 20) return 'error';
    return 'error';
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" gutterBottom>
          Driver Status Management
        </Typography>
        <IconButton onClick={() => setShowSettings(true)}>
          <SettingsIcon />
        </IconButton>
      </Box>

      <Grid container spacing={3}>
        {/* Main Status Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6">Current Status</Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  {driverStatus.isOnline ? (
                    <OnlineIcon color="success" />
                  ) : (
                    <OfflineIcon color="error" />
                  )}
                  <Chip 
                    label={driverStatus.availability.toUpperCase()} 
                    color={getStatusColor(driverStatus.availability) as any}
                    icon={getStatusIcon(driverStatus.availability)}
                  />
                </Box>
              </Box>

              <Box mb={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={driverStatus.isOnline}
                      onChange={handleOnlineToggle}
                      color="success"
                    />
                  }
                  label={driverStatus.isOnline ? "Online" : "Offline"}
                />
              </Box>

              <Box display="flex" gap={1} flexWrap="wrap">
                <Button
                  variant={driverStatus.availability === 'available' ? 'contained' : 'outlined'}
                  color="success"
                  size="small"
                  onClick={() => handleAvailabilityChange('available')}
                  disabled={!driverStatus.isOnline}
                >
                  Available
                </Button>
                <Button
                  variant={driverStatus.availability === 'busy' ? 'contained' : 'outlined'}
                  color="warning"
                  size="small"
                  onClick={() => handleAvailabilityChange('busy')}
                  disabled={!driverStatus.isOnline}
                >
                  Busy
                </Button>
                <Button
                  variant={driverStatus.availability === 'break' ? 'contained' : 'outlined'}
                  color="info"
                  size="small"
                  onClick={() => setShowBreakDialog(true)}
                  disabled={!driverStatus.isOnline}
                >
                  Break
                </Button>
              </Box>

              {driverStatus.availability === 'break' && (
                <Box mt={2}>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={handleEndBreak}
                    startIcon={<CheckCircleIcon />}
                  >
                    End Break
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Vehicle Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Vehicle Status
              </Typography>
              
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  {driverStatus.vehicleInfo.type} - {driverStatus.vehicleInfo.model}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  License: {driverStatus.vehicleInfo.licensePlate}
                </Typography>
              </Box>

              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <DeliveryIcon color="primary" />
                  <Typography variant="body2">Fuel:</Typography>
                  <Chip 
                    label={`${driverStatus.vehicleInfo.fuelLevel}%`}
                    color={getFuelColor(driverStatus.vehicleInfo.fuelLevel) as any}
                    size="small"
                  />
                </Box>
                {driverStatus.vehicleInfo.batteryLevel && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <BatteryIcon color="primary" />
                    <Typography variant="body2">Battery:</Typography>
                    <Chip 
                      label={`${driverStatus.vehicleInfo.batteryLevel}%`}
                      color={getBatteryColor(driverStatus.vehicleInfo.batteryLevel) as any}
                      size="small"
                    />
                  </Box>
                )}
              </Box>

              <Button variant="outlined" size="small" startIcon={<EditIcon />}>
                Update Vehicle Info
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Location & Performance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Location & Performance
              </Typography>
              
              <Box mb={2}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <LocationIcon color="primary" />
                  <Typography variant="body2">Current Location</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Lat: {driverStatus.currentLocation.lat.toFixed(6)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Lng: {driverStatus.currentLocation.lng.toFixed(6)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Accuracy: ±{driverStatus.currentLocation.accuracy}m
                </Typography>
              </Box>

              <Box display="flex" gap={2} flexWrap="wrap">
                <Box textAlign="center">
                  <Typography variant="h6" color="primary.main">
                    {driverStatus.performance.totalHoursToday}h
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Hours Today
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h6" color="success.main">
                    {driverStatus.performance.deliveriesCompleted}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Deliveries
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h6" color="warning.main">
                    {driverStatus.performance.averageRating}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Rating
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Status History */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Status History
              </Typography>
              <List dense>
                {statusHistory.slice(0, 4).map((entry, index) => (
                  <React.Fragment key={entry.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getStatusIcon(entry.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                              {entry.status}
                            </Typography>
                            {entry.duration > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                ({entry.duration}m)
                              </Typography>
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              {entry.timestamp.toLocaleString()}
                            </Typography>
                            {entry.location && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {entry.location}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < statusHistory.slice(0, 4).length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Break Dialog */}
      <Dialog open={showBreakDialog} onClose={() => setShowBreakDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Start Break</DialogTitle>
        <DialogContent>
          <Box>
            <FormControl fullWidth margin="normal">
              <InputLabel>Break Duration</InputLabel>
              <Select
                value={breakDuration}
                label="Break Duration"
                onChange={(e) => setBreakDuration(e.target.value as number)}
              >
                <MenuItem value={5}>5 minutes</MenuItem>
                <MenuItem value={10}>10 minutes</MenuItem>
                <MenuItem value={15}>15 minutes</MenuItem>
                <MenuItem value={30}>30 minutes</MenuItem>
                <MenuItem value={60}>1 hour</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Break Reason (Optional)"
              multiline
              rows={3}
              value={breakReason}
              onChange={(e) => setBreakReason(e.target.value)}
              placeholder="e.g., Lunch break, rest, personal errand..."
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBreakDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleStartBreak}>
            Start Break
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <SettingsIcon />
            <Typography variant="h6">Status Settings</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Working Hours
              </Typography>
              <Box display="flex" gap={2}>
                <TextField
                  label="Start Time"
                  type="time"
                  value={driverStatus.workingHours.start}
                  size="small"
                />
                <TextField
                  label="End Time"
                  type="time"
                  value={driverStatus.workingHours.end}
                  size="small"
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Break Settings
              </Typography>
              <Box display="flex" gap={2}>
                <TextField
                  label="Max Break Duration (min)"
                  type="number"
                  value={driverStatus.breakSettings.maxBreakDuration}
                  size="small"
                />
                <TextField
                  label="Reminder Interval (hrs)"
                  type="number"
                  value={driverStatus.breakSettings.breakReminderInterval}
                  size="small"
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<SaveIcon />}>
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default DriverStatusManagement;
