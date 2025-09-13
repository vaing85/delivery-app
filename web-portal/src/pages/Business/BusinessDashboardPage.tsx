import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { BusinessDashboard } from '../../components/Dashboard';
import { useAuthStore } from '../../store/authStore';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usersAPI, deliveriesAPI } from '../../services/api';

const BusinessDashboardPage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  // Only allow business access
  if (!isAuthenticated || user?.role !== 'BUSINESS') {
    return <Navigate to="/business/login" replace />;
  }

  // Fetch dashboard stats
  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users', refreshKey],
    queryFn: () => usersAPI.getUsers({ limit: 1000 }),
  });

  const { data: deliveriesData, isLoading: deliveriesLoading, error: deliveriesError } = useQuery({
    queryKey: ['deliveries', refreshKey],
    queryFn: () => deliveriesAPI.getDeliveries({ limit: 1000 }),
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Calculate stats
  const stats = React.useMemo(() => {
    if (!usersData?.data || !deliveriesData?.data) {
      return null;
    }

    const users = usersData.data;
    const deliveries = deliveriesData.data;

    const totalDrivers = users.filter((user: any) => user.role === 'DRIVER').length;
    const totalDeliveries = deliveries.length;
    const completedDeliveries = deliveries.filter((delivery: any) => delivery.status === 'DELIVERED').length;
    
    // Calculate average rating (mock for now)
    const averageRating = 4.6;
    
    // Calculate total revenue (mock for now)
    const totalRevenue = 12450;

    return {
      totalDrivers,
      totalDeliveries,
      completedDeliveries,
      averageRating,
      totalRevenue,
    };
  }, [usersData, deliveriesData]);

  const isLoading = usersLoading || deliveriesLoading;
  const hasError = usersError || deliveriesError;

  if (hasError) {
    return (
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Alert severity="error">
          Failed to load business dashboard data. Please try again.
        </Alert>
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
          Business Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your drivers, monitor business performance, and oversee operations.
        </Typography>
      </Paper>

      {isLoading ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <CircularProgress size={40} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading Business Dashboard...
          </Typography>
        </Paper>
      ) : stats ? (
        <BusinessDashboard
          stats={{
            totalDrivers: stats.totalDrivers,
            totalDeliveries: stats.totalDeliveries,
            totalRevenue: stats.totalRevenue,
            averageRating: stats.averageRating,
          }}
          onRefresh={handleRefresh}
        />
      ) : (
        <Alert severity="warning">
          No data available for business dashboard.
        </Alert>
      )}
    </Box>
  );
};

export default BusinessDashboardPage;
