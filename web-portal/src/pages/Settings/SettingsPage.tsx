import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  CardActions,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Chip
} from '@mui/material';

import { useAuthStore } from '../../store/authStore';
import { usersAPI } from '../../services/api';

interface DriverProfile {
  id: string;
  userId: string;
  licenseNumber: string;
  vehicleType: string;
  vehicleModel?: string;
  isAvailable: boolean;
  backgroundCheck: boolean;
  currentLocationLat?: number;
  currentLocationLng?: number;
  rating?: number;
  totalDeliveries: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: string;
  };
}

const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);

  // Driver profile form state
  const [isAvailable, setIsAvailable] = useState(false);
  const [vehicleType, setVehicleType] = useState('CAR');
  const [vehicleModel, setVehicleModel] = useState('');
  const [currentLocationLat, setCurrentLocationLat] = useState('');
  const [currentLocationLng, setCurrentLocationLng] = useState('');

  useEffect(() => {
    if (user?.role === 'DRIVER') {
      loadDriverProfile();
    }
  }, [user]);

  const loadDriverProfile = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getDriverProfile();
      if (response.success) {
        setDriverProfile(response.data);
        setIsAvailable(response.data.isAvailable);
        setVehicleType(response.data.vehicleType || 'CAR');
        setVehicleModel(response.data.vehicleModel || '');
        setCurrentLocationLat(response.data.currentLocationLat?.toString() || '');
        setCurrentLocationLng(response.data.currentLocationLng?.toString() || '');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load driver profile');
    } finally {
      setLoading(false);
    }
  };

  const updateDriverProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const updateData: any = {
        isAvailable,
        vehicleType,
        vehicleModel
      };

      if (currentLocationLat && currentLocationLng) {
        updateData.currentLocationLat = parseFloat(currentLocationLat);
        updateData.currentLocationLng = parseFloat(currentLocationLng);
      }

      const response = await usersAPI.updateDriverProfile(updateData);
      if (response.success) {
        setSuccess('Driver profile updated successfully!');
        await loadDriverProfile(); // Reload the profile
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update driver profile');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocationLat(position.coords.latitude.toString());
          setCurrentLocationLng(position.coords.longitude.toString());
        },
        (error) => {
          setError('Failed to get current location: ' + error.message);
        }
      );
    } else {
      setError('Geolocation is not supported by this browser');
    }
  };

  if (!user) {
    return (
      <Box p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* User Profile Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              User Profile
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="First Name"
                value={user.firstName || ''}
                disabled
                fullWidth
              />
              <TextField
                label="Last Name"
                value={user.lastName || ''}
                disabled
                fullWidth
              />
              <TextField
                label="Email"
                value={user.email || ''}
                disabled
                fullWidth
              />
              <TextField
                label="Role"
                value={user.role || ''}
                disabled
                fullWidth
              />
            </Box>
          </Paper>
        </Grid>

        {/* Driver Profile Section - Only show for drivers */}
        {user.role === 'DRIVER' && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Driver Profile
              </Typography>
              {loading ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" gap={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isAvailable}
                        onChange={(e) => setIsAvailable(e.target.checked)}
                      />
                    }
                    label="Available for Deliveries"
                  />

                  <FormControl fullWidth>
                    <InputLabel>Vehicle Type</InputLabel>
                    <Select
                      value={vehicleType}
                      label="Vehicle Type"
                      onChange={(e) => setVehicleType(e.target.value)}
                    >
                      <MenuItem value="CAR">Car</MenuItem>
                      <MenuItem value="MOTORCYCLE">Motorcycle</MenuItem>
                      <MenuItem value="BICYCLE">Bicycle</MenuItem>
                      <MenuItem value="TRUCK">Truck</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Vehicle Model"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    fullWidth
                    placeholder="e.g., Toyota Camry, Honda Civic"
                  />

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Current Location
                    </Typography>
                    <Box display="flex" gap={1}>
                      <TextField
                        label="Latitude"
                        value={currentLocationLat}
                        onChange={(e) => setCurrentLocationLat(e.target.value)}
                        type="number"
                        size="small"
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        label="Longitude"
                        value={currentLocationLng}
                        onChange={(e) => setCurrentLocationLng(e.target.value)}
                        type="number"
                        size="small"
                        sx={{ flex: 1 }}
                      />
                      <Button
                        variant="outlined"
                        onClick={getCurrentLocation}
                        size="small"
                      >
                        Get Location
                      </Button>
                    </Box>
                  </Box>

                  <Button
                    variant="contained"
                    onClick={updateDriverProfile}
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? <CircularProgress size={24} /> : 'Update Profile'}
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>
        )}

        {/* Driver Stats - Only show for drivers */}
        {user.role === 'DRIVER' && driverProfile && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Driver Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Deliveries
                      </Typography>
                      <Typography variant="h4">
                        {driverProfile.totalDeliveries}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Rating
                      </Typography>
                      <Typography variant="h4">
                        {driverProfile.rating ? `${driverProfile.rating}/5` : 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        License Number
                      </Typography>
                      <Typography variant="h6">
                        {driverProfile.licenseNumber}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Background Check
                      </Typography>
                      <Typography variant="h6" color={driverProfile.backgroundCheck ? 'success.main' : 'error.main'}>
                        {driverProfile.backgroundCheck ? 'Passed' : 'Pending'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* General Settings */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              General Settings
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Email Notifications"
              />
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Push Notifications"
              />
              <FormControlLabel
                control={<Switch />}
                label="Dark Mode"
              />
            </Box>
          </Paper>
        </Grid>

        {/* Customer-specific Settings */}
        {user?.role === 'CUSTOMER' && (
          <>
            {/* Delivery Preferences */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Delivery Preferences
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Preferred Delivery Time</InputLabel>
                      <Select
                        value="anytime"
                        label="Preferred Delivery Time"
                        onChange={() => {}}
                      >
                        <MenuItem value="anytime">Any Time</MenuItem>
                        <MenuItem value="morning">Morning (8 AM - 12 PM)</MenuItem>
                        <MenuItem value="afternoon">Afternoon (12 PM - 5 PM)</MenuItem>
                        <MenuItem value="evening">Evening (5 PM - 9 PM)</MenuItem>
                        <MenuItem value="night">Night (9 PM - 12 AM)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Contact Method</InputLabel>
                      <Select
                        value="both"
                        label="Contact Method"
                        onChange={() => {}}
                      >
                        <MenuItem value="email">Email Only</MenuItem>
                        <MenuItem value="sms">SMS Only</MenuItem>
                        <MenuItem value="both">Both Email & SMS</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Special Delivery Instructions"
                      multiline
                      rows={3}
                      fullWidth
                      placeholder="e.g., Leave at front door, Call before delivery, etc."
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Allow Driver to Leave Package if No Answer"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Send Delivery Updates"
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Customer Profile & Loyalty */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Customer Profile & Loyalty
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Total Orders
                        </Typography>
                        <Typography variant="h4">
                          {user.customerProfile?.totalOrders || 0}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Total Spent
                        </Typography>
                        <Typography variant="h4">
                          ${user.customerProfile?.totalSpent?.toFixed(2) || '0.00'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Loyalty Points
                        </Typography>
                        <Typography variant="h4" color="primary">
                          {user.customerProfile?.loyaltyPoints || 0} pts
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Loyalty Program Benefits
                    </Typography>
                    <Box display="flex" gap={2} flexWrap="wrap">
                      <Chip label="Free Delivery on Orders >$50" color="success" variant="outlined" />
                      <Chip label="Priority Support" color="primary" variant="outlined" />
                      <Chip label="Exclusive Offers" color="secondary" variant="outlined" />
                      <Chip label="Birthday Rewards" color="info" variant="outlined" />
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Address Book */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Saved Addresses
                  </Typography>
                  <Button variant="outlined" size="small">
                    Add New Address
                  </Button>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Home Address
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          123 Main Street, Apt 4B<br />
                          New York, NY 10001
                        </Typography>
                        <Box mt={1}>
                          <Chip label="Default" size="small" color="primary" />
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button size="small">Edit</Button>
                        <Button size="small" color="error">Remove</Button>
                      </CardActions>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Work Address
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          456 Business Ave, Suite 200<br />
                          New York, NY 10002
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button size="small">Edit</Button>
                        <Button size="small" color="error">Remove</Button>
                      </CardActions>
                    </Card>
                  </Grid>
                </Grid>
      </Paper>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
};

export default SettingsPage;
