import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Home as HomeIcon } from '@mui/icons-material';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      textAlign="center"
      gap={3}
    >
      <Typography variant="h1" color="primary">
        404
      </Typography>
      
      <Typography variant="h4" gutterBottom>
        Page Not Found
      </Typography>
      
      <Typography variant="body1" color="text.secondary" maxWidth={400}>
        The page you're looking for doesn't exist or has been moved.
      </Typography>
      
      <Button
        variant="contained"
        size="large"
        startIcon={<HomeIcon />}
        onClick={() => navigate('/')}
      >
        Go Home
      </Button>
    </Box>
  );
};

export default NotFoundPage;
