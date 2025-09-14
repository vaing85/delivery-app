import React from 'react';
import { Box, Skeleton, Card, CardContent, Grid } from '@mui/material';

interface SkeletonLoaderProps {
  variant?: 'card' | 'table' | 'list' | 'dashboard' | 'custom';
  count?: number;
  height?: number;
  width?: number;
  animation?: 'pulse' | 'wave' | false;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'card',
  count = 1,
  height = 20,
  width,
  animation = 'wave'
}) => {
  const renderCardSkeleton = () => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Skeleton variant="text" width="60%" height={24} animation={animation} />
        <Skeleton variant="text" width="40%" height={20} animation={animation} />
        <Skeleton variant="rectangular" width="100%" height={120} sx={{ mt: 2 }} animation={animation} />
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Skeleton variant="rectangular" width={80} height={32} animation={animation} />
          <Skeleton variant="rectangular" width={80} height={32} animation={animation} />
        </Box>
      </CardContent>
    </Card>
  );

  const renderTableSkeleton = () => (
    <Box>
      <Skeleton variant="rectangular" width="100%" height={56} animation={animation} />
      {Array.from({ length: count }).map((_, index) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Skeleton variant="circular" width={40} height={40} animation={animation} />
          <Box sx={{ ml: 2, flexGrow: 1 }}>
            <Skeleton variant="text" width="30%" height={20} animation={animation} />
            <Skeleton variant="text" width="50%" height={16} animation={animation} />
          </Box>
          <Skeleton variant="rectangular" width={80} height={32} animation={animation} />
        </Box>
      ))}
    </Box>
  );

  const renderListSkeleton = () => (
    <Box>
      {Array.from({ length: count }).map((_, index) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', p: 2, mb: 1 }}>
          <Skeleton variant="circular" width={48} height={48} animation={animation} />
          <Box sx={{ ml: 2, flexGrow: 1 }}>
            <Skeleton variant="text" width="40%" height={20} animation={animation} />
            <Skeleton variant="text" width="60%" height={16} animation={animation} />
          </Box>
          <Skeleton variant="rectangular" width={60} height={24} animation={animation} />
        </Box>
      ))}
    </Box>
  );

  const renderDashboardSkeleton = () => (
    <Grid container spacing={3}>
      {/* Stats Cards */}
      {Array.from({ length: 4 }).map((_, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width="60%" height={24} animation={animation} />
              <Skeleton variant="text" width="40%" height={20} animation={animation} />
              <Skeleton variant="rectangular" width="100%" height={60} sx={{ mt: 1 }} animation={animation} />
            </CardContent>
          </Card>
        </Grid>
      ))}
      
      {/* Chart */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Skeleton variant="text" width="30%" height={24} animation={animation} />
            <Skeleton variant="rectangular" width="100%" height={300} sx={{ mt: 2 }} animation={animation} />
          </CardContent>
        </Card>
      </Grid>
      
      {/* Recent Activity */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Skeleton variant="text" width="40%" height={24} animation={animation} />
            {Array.from({ length: 5 }).map((_, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <Skeleton variant="circular" width={32} height={32} animation={animation} />
                <Box sx={{ ml: 2, flexGrow: 1 }}>
                  <Skeleton variant="text" width="70%" height={16} animation={animation} />
                  <Skeleton variant="text" width="50%" height={14} animation={animation} />
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderCustomSkeleton = () => (
    <Box>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          variant="rectangular"
          width={width || '100%'}
          height={height}
          animation={animation}
          sx={{ mb: 1 }}
        />
      ))}
    </Box>
  );

  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return Array.from({ length: count }).map((_, index) => (
          <React.Fragment key={index}>{renderCardSkeleton()}</React.Fragment>
        ));
      case 'table':
        return renderTableSkeleton();
      case 'list':
        return renderListSkeleton();
      case 'dashboard':
        return renderDashboardSkeleton();
      case 'custom':
        return renderCustomSkeleton();
      default:
        return renderCustomSkeleton();
    }
  };

  return <Box>{renderSkeleton()}</Box>;
};

export default SkeletonLoader;
