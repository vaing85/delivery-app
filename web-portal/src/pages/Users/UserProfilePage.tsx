import React from 'react';
import { useParams } from 'react-router-dom';
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
  CardContent
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  CalendarToday as CalendarIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { CircularProgress } from '@mui/material';

const UserProfilePage: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Mock user data
  const user = {
    id: userId,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    phone: '+1-555-0123',
    role: 'CUSTOMER',
    status: 'active',
    createdAt: '2024-01-10',
    lastLogin: '2024-01-15 09:30 AM',
    profile: {
      avatar: null,
      bio: 'Regular customer who loves fast delivery service.',
      address: '123 Main St, City, State 12345',
      preferences: {
        notifications: true,
        emailUpdates: true,
        smsUpdates: false
      }
    },
    stats: {
      totalOrders: 15,
      completedDeliveries: 12,
      totalSpent: 450.99,
      averageRating: 4.8
    }
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
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'success' : 'error';
  };

  // Show loading state if not authenticated
  if (!isAuthenticated) {
    return (
      <Box p={3}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={40} />
        </Box>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/users')}
          >
            Back to Users
          </Button>
          <Typography variant="h4" component="h1">
            User Profile
          </Typography>
        </Box>
        
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => console.log('Edit user')}
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
                <Avatar
                  sx={{ width: 100, height: 100, fontSize: '2rem' }}
                >
                  {user.firstName[0]}{user.lastName[0]}
                </Avatar>
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
                    label={user.status}
                    color={getStatusColor(user.status) as any}
                    size="small"
                  />
                </Box>
                <Typography variant="body1" color="text.secondary">
                  {user.profile.bio}
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
                    {user.stats.totalOrders}
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
                    {user.stats.completedDeliveries}
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
                    ${user.stats.totalSpent}
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
                    {user.stats.averageRating}
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
                <ListItemText primary="Phone" secondary={user.phone} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <LocationIcon />
                </ListItemIcon>
                <ListItemText primary="Address" secondary={user.profile.address} />
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
                <ListItemText primary="Member Since" secondary={user.createdAt} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CalendarIcon />
                </ListItemIcon>
                <ListItemText primary="Last Login" secondary={user.lastLogin} />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Preferences */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Preferences
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="body2">
                    Push Notifications
                  </Typography>
                  <Chip
                    label={user.profile.preferences.notifications ? 'Enabled' : 'Disabled'}
                    color={user.profile.preferences.notifications ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="body2">
                    Email Updates
                  </Typography>
                  <Chip
                    label={user.profile.preferences.emailUpdates ? 'Enabled' : 'Disabled'}
                    color={user.profile.preferences.emailUpdates ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="body2">
                    SMS Updates
                  </Typography>
                  <Chip
                    label={user.profile.preferences.smsUpdates ? 'Enabled' : 'Disabled'}
                    color={user.profile.preferences.smsUpdates ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserProfilePage;
