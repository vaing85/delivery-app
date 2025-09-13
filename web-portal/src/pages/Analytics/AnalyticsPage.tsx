import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import AnalyticsDashboard from '../../components/Analytics/AnalyticsDashboard';
import { useAuthStore } from '../../store/authStore';
import { Navigate } from 'react-router-dom';

const AnalyticsPage: React.FC = () => {
  const { user } = useAuthStore();

  // Only allow ADMIN and BUSINESS roles to access analytics
  if (!user || (user.role !== 'ADMIN' && user.role !== 'BUSINESS')) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Container maxWidth="xl">
      <Box py={3}>
        <AnalyticsDashboard />
      </Box>
    </Container>
  );
};

export default AnalyticsPage;