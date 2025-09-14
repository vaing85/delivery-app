import React, { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const DefaultFallback = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="200px"
    flexDirection="column"
  >
    <CircularProgress size={40} />
    <Box mt={2} textAlign="center">
      <Box component="span" sx={{ variant: 'body2', color: 'text.secondary' }}>
        Loading...
      </Box>
    </Box>
  </Box>
);

const LazyWrapper: React.FC<LazyWrapperProps> = ({ 
  children, 
  fallback = <DefaultFallback /> 
}) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};

export default LazyWrapper;
