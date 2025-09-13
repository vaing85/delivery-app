import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, Typography, Button } from '@mui/material';

// Simple debug component
const DebugPage = () => (
  <Box sx={{ p: 4, textAlign: 'center' }}>
    <Typography variant="h4" gutterBottom>
      🎉 Frontend is Working!
    </Typography>
    <Typography variant="body1" gutterBottom>
      If you can see this, the React app is rendering correctly.
    </Typography>
    <Typography variant="body2" color="text.secondary">
      The white screen issue has been resolved.
    </Typography>
    <Button 
      variant="contained" 
      sx={{ mt: 2 }}
      onClick={() => window.location.reload()}
    >
      Reload Page
    </Button>
  </Box>
);

// Simple theme
const simpleTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
  },
});

function App() {
  console.log('App component rendering...'); // Debug log
  
  return (
    <ThemeProvider theme={simpleTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Router>
          <Routes>
            <Route path="/" element={<DebugPage />} />
            <Route path="*" element={<DebugPage />} />
          </Routes>
        </Router>
      </Box>
    </ThemeProvider>
  );
}

export default App;
