import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  LocalShipping as DeliveryIcon,
  Star as StarIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { usersAPI } from '@/services/api';

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isAvailable: boolean;
  vehicleType: string;
  vehicleModel: string;
  rating: number;
  totalDeliveries: number;
  joinedDate: string;
  currentLocation?: string;
  lastActive?: string;
  earnings?: number;
}

const DriversPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  // Redirect if not authenticated or not business/admin
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/business/login');
      return;
    }
    
    if (user?.role !== 'BUSINESS' && user?.role !== 'ADMIN') {
      navigate('/dashboard');
      return;
    }
  }, [isAuthenticated, user, navigate]);
  const [drivers, setDrivers] = useState<Driver[]>([
    {
      id: '1',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      phone: '+1 (555) 123-4567',
      isAvailable: true,
      vehicleType: 'Car',
      vehicleModel: 'Toyota Camry',
      rating: 4.8,
      totalDeliveries: 156,
      joinedDate: '2024-01-15',
      currentLocation: 'Downtown',
      lastActive: '2 minutes ago',
      earnings: 2847.50,
    },
    {
      id: '2',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+1 (555) 234-5678',
      isAvailable: false,
      vehicleType: 'Van',
      vehicleModel: 'Ford Transit',
      rating: 4.9,
      totalDeliveries: 203,
      joinedDate: '2023-11-20',
      currentLocation: 'Business District',
      lastActive: '15 minutes ago',
      earnings: 3201.75,
    },
    {
      id: '3',
      firstName: 'Mike',
      lastName: 'Davis',
      email: 'mike.davis@example.com',
      phone: '+1 (555) 345-6789',
      isAvailable: true,
      vehicleType: 'Motorcycle',
      vehicleModel: 'Honda CB500X',
      rating: 4.6,
      totalDeliveries: 89,
      joinedDate: '2024-03-10',
      currentLocation: 'Residential North',
      lastActive: '1 minute ago',
      earnings: 1654.20,
    },
  ]);

  const [openAddDriver, setOpenAddDriver] = useState(false);
  const [openEditDriver, setOpenEditDriver] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [newDriver, setNewDriver] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    vehicleType: '',
    vehicleModel: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const handleAddDriver = async () => {
    setError(null);
    setLoading(true);

    try {
      // Check authentication status
      const token = localStorage.getItem('accessToken');
      console.log('Current user:', user);
      console.log('Access token exists:', !!token);
      console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'No token');
      
      console.log('Adding driver with data:', newDriver);
      const response = await usersAPI.registerDriver(newDriver);
      console.log('API response:', response);

      if (response.success) {
        const driverProfile = response.data.driver.driverProfile;
        const newDriverData: Driver = {
          id: response.data.driver.id,
          firstName: response.data.driver.firstName,
          lastName: response.data.driver.lastName,
          email: response.data.driver.email,
          phone: response.data.driver.phone,
          isAvailable: driverProfile?.isAvailable || true,
          vehicleType: driverProfile?.vehicleType || newDriver.vehicleType,
          vehicleModel: driverProfile?.vehicleModel || newDriver.vehicleModel,
          rating: driverProfile?.rating || 0,
          totalDeliveries: driverProfile?.totalDeliveries || 0,
          joinedDate: new Date(response.data.driver.createdAt).toISOString().split('T')[0],
          currentLocation: 'Not available',
          lastActive: 'Just joined',
          earnings: 0,
        };

        setDrivers(prev => [...prev, newDriverData]);
        setTempPassword(response.data.tempPassword);
        setSuccess(`Driver added successfully with profile! Please share the temporary password with the driver for their first login.`);
        setOpenAddDriver(false);
        setNewDriver({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          vehicleType: '',
          vehicleModel: '',
        });
      } else {
        setError(response.message || 'Failed to add driver');
      }
    } catch (err: any) {
      console.error('Error adding driver:', err);
      const errorMessage = err.response?.data?.error?.message || 
                          err.response?.data?.message || 
                          err.message || 
                          'Failed to add driver. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditDriver = (driver: Driver) => {
    setSelectedDriver(driver);
    setNewDriver({
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email,
      phone: driver.phone,
      vehicleType: driver.vehicleType,
      vehicleModel: driver.vehicleModel,
    });
    setOpenEditDriver(true);
  };

  const handleUpdateDriver = async () => {
    if (!selectedDriver) return;

    setError(null);
    setLoading(true);

    try {
      // Mock update - in real app, you'd call an API
      await new Promise(resolve => setTimeout(resolve, 1000));

      setDrivers(prev => prev.map(driver => 
        driver.id === selectedDriver.id 
          ? { ...driver, ...newDriver }
          : driver
      ));

      setSuccess('Driver updated successfully!');
      setOpenEditDriver(false);
      setSelectedDriver(null);
      setNewDriver({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        vehicleType: '',
        vehicleModel: '',
      });
    } catch (err: any) {
      setError('Failed to update driver. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDriver = (driverId: string) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      setDrivers(prev => prev.filter(driver => driver.id !== driverId));
      setSuccess('Driver deleted successfully!');
    }
  };

  const handleToggleAvailability = (driverId: string) => {
    setDrivers(prev => prev.map(driver => 
      driver.id === driverId 
        ? { ...driver, isAvailable: !driver.isAvailable }
        : driver
    ));
  };

  const handleCopyPassword = async () => {
    if (tempPassword) {
      try {
        await navigator.clipboard.writeText(tempPassword);
        setSuccess('Temporary password copied to clipboard!');
        setTimeout(() => setSuccess(null), 2000);
      } catch (err) {
        console.error('Failed to copy password:', err);
      }
    }
  };

  const totalDrivers = drivers.length;
  const activeDrivers = drivers.filter(d => d.isAvailable).length;
  const totalDeliveries = drivers.reduce((sum, d) => sum + d.totalDeliveries, 0);
  const averageRating = drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length;

  // Show loading while checking authentication
  if (!isAuthenticated || (user?.role !== 'BUSINESS' && user?.role !== 'ADMIN')) {
    return (
      <Box sx={{ flexGrow: 1, p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Checking authentication...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Driver Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your drivers, view their performance, and add new drivers to your team.
        </Typography>
      </Paper>

      {/* Driver Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PersonIcon color="primary" sx={{ mr: 2, fontSize: 32 }} />
                <Box>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {totalDrivers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Drivers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <DeliveryIcon color="success" sx={{ mr: 2, fontSize: 32 }} />
                <Box>
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {activeDrivers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Now
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <StarIcon color="warning" sx={{ mr: 2, fontSize: 32 }} />
                <Box>
                  <Typography variant="h4" color="warning.main" fontWeight="bold">
                    {averageRating.toFixed(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Rating
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <DeliveryIcon color="info" sx={{ mr: 2, fontSize: 32 }} />
                <Box>
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    {totalDeliveries}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Deliveries
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Drivers Table */}
      <Paper sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Typography variant="h6" component="h2">
            Driver List
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddDriver(true)}
          >
            Add Driver
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Driver</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Vehicle</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Deliveries</TableCell>
                <TableCell>Earnings</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 2, width: 40, height: 40 }}>
                        {driver.firstName[0]}{driver.lastName[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {driver.firstName} {driver.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Joined: {new Date(driver.joinedDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Box display="flex" alignItems="center" mb={0.5}>
                        <EmailIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">{driver.email}</Typography>
                      </Box>
                      <Box display="flex" alignItems="center">
                        <PhoneIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">{driver.phone}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {driver.vehicleType}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {driver.vehicleModel}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={driver.isAvailable ? 'Available' : 'Offline'}
                      color={driver.isAvailable ? 'success' : 'default'}
                      size="small"
                      onClick={() => handleToggleAvailability(driver.id)}
                      sx={{ cursor: 'pointer' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <StarIcon sx={{ fontSize: 16, color: 'warning.main', mr: 0.5 }} />
                      <Typography variant="body2">{driver.rating.toFixed(1)}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{driver.totalDeliveries}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      ${driver.earnings?.toLocaleString() || '0'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => navigate(`/drivers/${driver.id}`)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Driver">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleEditDriver(driver)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Driver">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteDriver(driver.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add Driver Dialog */}
      <Dialog open={openAddDriver} onClose={() => setOpenAddDriver(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Driver</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="First Name"
              value={newDriver.firstName}
              onChange={(e) => setNewDriver(prev => ({ ...prev, firstName: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Last Name"
              value={newDriver.lastName}
              onChange={(e) => setNewDriver(prev => ({ ...prev, lastName: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={newDriver.email}
              onChange={(e) => setNewDriver(prev => ({ ...prev, email: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Phone Number"
              type="tel"
              value={newDriver.phone}
              onChange={(e) => setNewDriver(prev => ({ ...prev, phone: e.target.value }))}
              fullWidth
              required
              placeholder="+1 (555) 123-4567"
            />
            <FormControl fullWidth required>
              <InputLabel>Vehicle Type</InputLabel>
              <Select
                value={newDriver.vehicleType}
                label="Vehicle Type"
                onChange={(e) => setNewDriver(prev => ({ ...prev, vehicleType: e.target.value }))}
              >
                <MenuItem value="Car">Car</MenuItem>
                <MenuItem value="Van">Van</MenuItem>
                <MenuItem value="Truck">Truck</MenuItem>
                <MenuItem value="Motorcycle">Motorcycle</MenuItem>
                <MenuItem value="Bicycle">Bicycle</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Vehicle Model"
              value={newDriver.vehicleModel}
              onChange={(e) => setNewDriver(prev => ({ ...prev, vehicleModel: e.target.value }))}
              fullWidth
              required
              placeholder="e.g., Toyota Camry"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDriver(false)}>Cancel</Button>
          <Button
            onClick={handleAddDriver}
            variant="contained"
            disabled={loading || !newDriver.firstName || !newDriver.lastName || !newDriver.email || !newDriver.phone || !newDriver.vehicleType || !newDriver.vehicleModel}
          >
            {loading ? <CircularProgress size={20} /> : 'Add Driver'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Driver Dialog */}
      <Dialog open={openEditDriver} onClose={() => setOpenEditDriver(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Driver</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="First Name"
              value={newDriver.firstName}
              onChange={(e) => setNewDriver(prev => ({ ...prev, firstName: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Last Name"
              value={newDriver.lastName}
              onChange={(e) => setNewDriver(prev => ({ ...prev, lastName: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={newDriver.email}
              onChange={(e) => setNewDriver(prev => ({ ...prev, email: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Phone Number"
              type="tel"
              value={newDriver.phone}
              onChange={(e) => setNewDriver(prev => ({ ...prev, phone: e.target.value }))}
              fullWidth
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Vehicle Type</InputLabel>
              <Select
                value={newDriver.vehicleType}
                label="Vehicle Type"
                onChange={(e) => setNewDriver(prev => ({ ...prev, vehicleType: e.target.value }))}
              >
                <MenuItem value="Car">Car</MenuItem>
                <MenuItem value="Van">Van</MenuItem>
                <MenuItem value="Truck">Truck</MenuItem>
                <MenuItem value="Motorcycle">Motorcycle</MenuItem>
                <MenuItem value="Bicycle">Bicycle</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Vehicle Model"
              value={newDriver.vehicleModel}
              onChange={(e) => setNewDriver(prev => ({ ...prev, vehicleModel: e.target.value }))}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDriver(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateDriver}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Update Driver'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert 
          severity="success" 
          sx={{ mt: 2 }} 
          onClose={() => {
            setSuccess(null);
            setTempPassword(null);
          }}
          action={
            tempPassword ? (
              <Box display="flex" alignItems="center" gap={2}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1, borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="bold">
                    Password: {tempPassword}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={handleCopyPassword}
                  sx={{ color: 'inherit' }}
                >
                  <CopyIcon />
                </IconButton>
              </Box>
            ) : null
          }
        >
          {success}
        </Alert>
      )}
    </Box>
  );
};

export default DriversPage;
