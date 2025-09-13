import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Chip,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Edit as EditIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  CalendarToday as CalendarIcon,
  Security as SecurityIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  Notifications as NotificationsIcon,
  Email as EmailNotificationsIcon,
  Sms as SmsIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '123 Main St, City, State 12345', // Mock data
    bio: 'Regular customer who loves fast delivery service.', // Mock data
    preferences: {
      notifications: true,
      emailUpdates: true,
      smsUpdates: false
    }
  });

  // Mock user stats
  const userStats = {
    totalOrders: 15,
    completedDeliveries: 12,
    totalSpent: 450.99,
    averageRating: 4.8,
    memberSince: '2024-01-10',
    lastLogin: '2024-01-15 09:30 AM'
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'error';
      case 'DRIVER':
        return 'primary';
      case 'DISPATCHER':
        return 'warning';
      case 'CUSTOMER':
        return 'success';
      case 'BUSINESS':
        return 'info';
      default:
        return 'default';
    }
  };

  const handleEdit = () => {
    setEditMode(true);
    setOpenDialog(true);
  };

  const handleSave = () => {
    // Here you would typically make an API call to update the user
    updateUser({
      ...user,
      ...formData
    });
    
    setEditMode(false);
    setOpenDialog(false);
    setSnackbar({
      open: true,
      message: 'Profile updated successfully!',
      severity: 'success'
    });
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: '123 Main St, City, State 12345',
      bio: 'Regular customer who loves fast delivery service.',
      preferences: {
        notifications: true,
        emailUpdates: true,
        smsUpdates: false
      }
    });
    setEditMode(false);
    setOpenDialog(false);
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('preferences.')) {
      const prefKey = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (!user) {
    return (
      <Box p={3}>
        <Typography variant="h4">Please log in to view your profile</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
          <Typography variant="h4" component="h1">
            My Profile
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={handleEdit}
        >
          Edit Profile
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Header */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item>
                <Box position="relative">
                  <Avatar
                    sx={{ width: 100, height: 100, fontSize: '2rem' }}
                  >
                    {user.firstName[0]}{user.lastName[0]}
                  </Avatar>
                  <Button
                    size="small"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      minWidth: 'auto',
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      }
                    }}
                  >
                    <PhotoCameraIcon sx={{ fontSize: 16 }} />
                  </Button>
                </Box>
              </Grid>
              <Grid item xs>
                <Typography variant="h4" gutterBottom>
                  {user.firstName} {user.lastName}
                </Typography>
                <Box display="flex" gap={2} mb={2}>
                  <Chip
                    label={user.role}
                    color={getRoleColor(user.role) as any}
                    size="small"
                  />
                  <Chip
                    label="Active"
                    color="success"
                    size="small"
                  />
                </Box>
                <Typography variant="body1" color="text.secondary">
                  {formData.bio}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* User Stats */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="primary" gutterBottom>
                    {userStats.totalOrders}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Orders
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="success.main" gutterBottom>
                    {userStats.completedDeliveries}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed Deliveries
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="info.main" gutterBottom>
                    ${userStats.totalSpent}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Spent
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="warning.main" gutterBottom>
                    {userStats.averageRating}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Rating
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Contact Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Contact Information
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText primary="Email" secondary={user.email} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText primary="Phone" secondary={user.phone || 'Not provided'} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <LocationIcon />
                </ListItemIcon>
                <ListItemText primary="Address" secondary={formData.address} />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Account Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Account Information
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <WorkIcon />
                </ListItemIcon>
                <ListItemText primary="Role" secondary={user.role} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CalendarIcon />
                </ListItemIcon>
                <ListItemText primary="Member Since" secondary={userStats.memberSince} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CalendarIcon />
                </ListItemIcon>
                <ListItemText primary="Last Login" secondary={userStats.lastLogin} />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Preferences */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notification Preferences
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Box display="flex" alignItems="center" gap={2}>
                  <NotificationsIcon color="primary" />
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      Push Notifications
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Get notified about order updates
                    </Typography>
                  </Box>
                  <Chip
                    label={formData.preferences.notifications ? 'Enabled' : 'Disabled'}
                    color={formData.preferences.notifications ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box display="flex" alignItems="center" gap={2}>
                  <EmailNotificationsIcon color="primary" />
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      Email Updates
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Receive email notifications
                    </Typography>
                  </Box>
                  <Chip
                    label={formData.preferences.emailUpdates ? 'Enabled' : 'Disabled'}
                    color={formData.preferences.emailUpdates ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box display="flex" alignItems="center" gap={2}>
                  <SmsIcon color="primary" />
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      SMS Updates
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Get text message alerts
                    </Typography>
                  </Box>
                  <Chip
                    label={formData.preferences.smsUpdates ? 'Enabled' : 'Disabled'}
                    color={formData.preferences.smsUpdates ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Profile Dialog */}
      <Dialog open={openDialog} onClose={handleCancel} maxWidth="md" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bio"
                multiline
                rows={3}
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Notification Preferences
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.preferences.notifications}
                    onChange={(e) => handleInputChange('preferences.notifications', e.target.checked)}
                  />
                }
                label="Push Notifications"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.preferences.emailUpdates}
                    onChange={(e) => handleInputChange('preferences.emailUpdates', e.target.checked)}
                  />
                }
                label="Email Updates"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.preferences.smsUpdates}
                    onChange={(e) => handleInputChange('preferences.smsUpdates', e.target.checked)}
                  />
                }
                label="SMS Updates"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfilePage;
