import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { RouteOptimizationDashboard } from '../../components/RouteOptimization';
import { useAuthStore } from '../../store/authStore';

const RouteOptimizationPage: React.FC = () => {
  const { user } = useAuthStore();

  // Check if user has access to route optimization
  const hasAccess = user?.role === 'ADMIN' || user?.role === 'DRIVER' || user?.role === 'BUSINESS';

  if (!hasAccess) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to access route optimization features.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <RouteOptimizationDashboard />
    </Box>
  );
};

export default RouteOptimizationPage;
