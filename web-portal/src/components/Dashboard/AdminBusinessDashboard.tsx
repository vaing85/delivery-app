import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
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
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
} from '@mui/material';
import {
  Business as BusinessIcon,
  People as PeopleIcon,
  LocalShipping as DeliveryIcon,
  TrendingUp as TrendingUpIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Star as StarIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Add as AddIcon,
  Assessment as AnalyticsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../../services/api';

interface Business {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  totalDrivers: number;
  totalDeliveries: number;
  totalRevenue: number;
  averageRating: number;
  joinedDate: string;
  lastActive: string;
}

interface AdminBusinessDashboardProps {
  stats: {
    totalBusinesses: number;
    activeBusinesses: number;
    totalDrivers: number;
    totalDeliveries: number;
    totalRevenue: number;
    averageRating: number;
  };
  onRefresh: () => void;
}

const AdminBusinessDashboard: React.FC<AdminBusinessDashboardProps> = ({ stats, onRefresh }) => {
  const navigate = useNavigate();
  const [openAddBusiness, setOpenAddBusiness] = useState(false);
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<{id: string, name: string, email: string} | null>(null);
  
  // Provide default stats if none are provided
  const defaultStats = {
    totalBusinesses: 0,
    activeBusinesses: 0,
    totalDrivers: 0,
    totalDeliveries: 0,
    totalRevenue: 0,
    averageRating: 0,
  };
  
  const safeStats = stats || defaultStats;

  const [newBusiness, setNewBusiness] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    businessName: '',
    businessAddress: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Mock data - in a real app, this would come from API
  const [businesses, setBusinesses] = useState<Business[]>([
    {
      id: '1',
      name: 'Delivery Express Inc.',
      email: 'admin@deliveryexpress.com',
      phone: '+1 (555) 123-4567',
      address: '123 Business Ave, City, State 12345',
      status: 'ACTIVE',
      totalDrivers: 8,
      totalDeliveries: 1247,
      totalRevenue: 45680.50,
      averageRating: 4.7,
      joinedDate: '2023-01-15',
      lastActive: '2024-01-15 14:30',
    },
    {
      id: '2',
      name: 'Quick Delivery Co.',
      email: 'contact@quickdelivery.com',
      phone: '+1 (555) 234-5678',
      address: '456 Commerce St, City, State 12345',
      status: 'ACTIVE',
      totalDrivers: 5,
      totalDeliveries: 892,
      totalRevenue: 32150.75,
      averageRating: 4.5,
      joinedDate: '2023-03-20',
      lastActive: '2024-01-15 12:15',
    },
    {
      id: '3',
      name: 'Fast Track Logistics',
      email: 'info@fasttrack.com',
      phone: '+1 (555) 345-6789',
      address: '789 Industrial Blvd, City, State 12345',
      status: 'INACTIVE',
      totalDrivers: 3,
      totalDeliveries: 456,
      totalRevenue: 18920.25,
      averageRating: 4.2,
      joinedDate: '2023-06-10',
      lastActive: '2024-01-10 09:45',
    },
  ]);

  const handleAddBusiness = async () => {
    setError(null);
    setLoading(true);

    try {
      // Validate form
      if (!newBusiness.firstName || !newBusiness.lastName || !newBusiness.email || 
          !newBusiness.phone || !newBusiness.businessName || !newBusiness.password) {
        setError('All fields are required');
        return;
      }

      if (newBusiness.password !== newBusiness.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (newBusiness.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      // In a real app, this would call an API endpoint to create the business
      // For now, we'll simulate the creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newBusinessData: Business = {
        id: Date.now().toString(),
        name: newBusiness.businessName,
        email: newBusiness.email,
        phone: newBusiness.phone,
        address: newBusiness.businessAddress,
        status: 'ACTIVE',
        totalDrivers: 0,
        totalDeliveries: 0,
        totalRevenue: 0,
        averageRating: 0,
        joinedDate: new Date().toISOString().split('T')[0],
        lastActive: new Date().toISOString(),
      };

      setBusinesses(prev => [...prev, newBusinessData]);
      setSuccess(`Business account created successfully! Login credentials sent to ${newBusiness.email}`);
      setOpenAddBusiness(false);
      setNewBusiness({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        businessName: '',
        businessAddress: '',
        password: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      setError('Failed to create business account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBusiness = (businessId: string) => {
    if (window.confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
      setBusinesses(prev => prev.filter(business => business.id !== businessId));
      setSuccess('Business deleted successfully!');
    }
  };

  const handleResetBusinessPassword = async () => {
    if (!selectedBusiness) return;
    
    setError(null);
    setLoading(true);

    try {
      // In a real app, this would call an API endpoint to reset the password
      // For now, we'll simulate the reset
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(`Password reset successful! New temporary password for ${selectedBusiness.name}: TempPass123!`);
      setOpenResetDialog(false);
      setSelectedBusiness(null);
    } catch (err: any) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openResetPasswordDialog = (businessId: string, businessName: string, businessEmail: string) => {
    setSelectedBusiness({ id: businessId, name: businessName, email: businessEmail });
    setOpenResetDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'warning';
      case 'SUSPENDED': return 'error';
      default: return 'default';
    }
  };

  return (
    <>
      {/* Admin Business Management Overview */}
      <Paper sx={{ p: 4, mt: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center">
            <BusinessIcon color="primary" sx={{ mr: 2, fontSize: 32 }} />
            <Typography variant="h5" component="h2" fontWeight="bold">
              Business Management
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddBusiness(true)}
          >
            Add New Business
          </Button>
        </Box>

        <Grid container spacing={4}>
          {/* Business Stats Section */}
          <Grid item xs={12} md={6}>
            <Box mb={3}>
              <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
                Business Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ bgcolor: 'primary.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                    <BusinessIcon color="primary" sx={{ fontSize: 24, mb: 1 }} />
                    <Typography variant="h4" color="primary.main" fontWeight="bold">
                      {safeStats.totalBusinesses}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Businesses
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ bgcolor: 'success.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                    <TrendingUpIcon color="success" sx={{ fontSize: 24, mb: 1 }} />
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      {safeStats.activeBusinesses}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Businesses
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Box mb={3}>
              <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
                System Overview
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ bgcolor: 'info.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                    <PeopleIcon color="info" sx={{ fontSize: 24, mb: 1 }} />
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      {safeStats.totalDrivers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Drivers
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ bgcolor: 'warning.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                    <DeliveryIcon color="warning" sx={{ fontSize: 24, mb: 1 }} />
                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                      {safeStats.totalDeliveries}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Deliveries
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Revenue & Performance Section */}
          <Grid item xs={12} md={6}>
            <Box mb={3}>
              <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
                Financial Overview
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ bgcolor: 'secondary.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                    <TrendingUpIcon color="secondary" sx={{ fontSize: 24, mb: 1 }} />
                    <Typography variant="h4" color="secondary.main" fontWeight="bold">
                      ${safeStats.totalRevenue.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Revenue
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ bgcolor: 'error.50', p: 2, borderRadius: 1, textAlign: 'center' }}>
                    <StarIcon color="error" sx={{ fontSize: 24, mb: 1 }} />
                    <Typography variant="h4" color="error.main" fontWeight="bold">
                      {safeStats.averageRating.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Rating
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Box mb={3}>
              <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<AnalyticsIcon />}
                  onClick={() => navigate('/analytics')}
                >
                  View Analytics
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PeopleIcon />}
                  onClick={() => navigate('/users')}
                >
                  Manage Users
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={onRefresh}
                >
                  Refresh Data
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Businesses List */}
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
          Business Accounts
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Manage all business accounts in your system
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Business</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Drivers</TableCell>
                <TableCell>Deliveries</TableCell>
                <TableCell>Revenue</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {businesses.map((business) => (
                <TableRow key={business.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        <BusinessIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {business.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {business.address}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {business.email}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {business.phone}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={business.status}
                      color={getStatusColor(business.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {business.totalDrivers}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {business.totalDeliveries}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      ${business.totalRevenue.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <StarIcon sx={{ fontSize: 16, color: 'warning.main', mr: 0.5 }} />
                      <Typography variant="body2" fontWeight="medium">
                        {business.averageRating.toFixed(1)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => navigate(`/business/${business.id}`)}>
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reset Password">
                        <IconButton 
                          size="small" 
                          onClick={() => openResetPasswordDialog(business.id, business.name, business.email)}
                        >
                          <SecurityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Business">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteBusiness(business.id)}
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

      {/* Error and Success Messages */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Add Business Dialog */}
      <Dialog open={openAddBusiness} onClose={() => setOpenAddBusiness(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Business Account</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="First Name"
              value={newBusiness.firstName}
              onChange={(e) => setNewBusiness(prev => ({ ...prev, firstName: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Last Name"
              value={newBusiness.lastName}
              onChange={(e) => setNewBusiness(prev => ({ ...prev, lastName: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={newBusiness.email}
              onChange={(e) => setNewBusiness(prev => ({ ...prev, email: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Phone Number"
              type="tel"
              value={newBusiness.phone}
              onChange={(e) => setNewBusiness(prev => ({ ...prev, phone: e.target.value }))}
              fullWidth
              required
              placeholder="+1 (555) 123-4567"
            />
            <TextField
              label="Business Name"
              value={newBusiness.businessName}
              onChange={(e) => setNewBusiness(prev => ({ ...prev, businessName: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Business Address"
              value={newBusiness.businessAddress}
              onChange={(e) => setNewBusiness(prev => ({ ...prev, businessAddress: e.target.value }))}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Password"
              type="password"
              value={newBusiness.password}
              onChange={(e) => setNewBusiness(prev => ({ ...prev, password: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Confirm Password"
              type="password"
              value={newBusiness.confirmPassword}
              onChange={(e) => setNewBusiness(prev => ({ ...prev, confirmPassword: e.target.value }))}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddBusiness(false)}>Cancel</Button>
          <Button 
            onClick={handleAddBusiness} 
            variant="contained" 
            disabled={loading || !newBusiness.firstName || !newBusiness.lastName || !newBusiness.email || !newBusiness.phone || !newBusiness.businessName || !newBusiness.password}
          >
            {loading ? 'Creating...' : 'Create Business'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Reset Confirmation Dialog */}
      <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <SecurityIcon color="warning" sx={{ mr: 1 }} />
            Reset Business Password
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to reset the password for:
          </Typography>
          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mt: 2 }}>
            <Typography variant="h6" color="primary.main">
              {selectedBusiness?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedBusiness?.email}
            </Typography>
          </Box>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This will generate a new temporary password. The business owner will need to change it on their next login.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResetDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleResetBusinessPassword} 
            variant="contained" 
            color="warning"
            disabled={loading}
            startIcon={<SecurityIcon />}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminBusinessDashboard;
