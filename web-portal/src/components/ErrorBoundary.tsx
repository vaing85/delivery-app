import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper, Alert } from '@mui/material';
import { Refresh as RefreshIcon, BugReport as BugReportIcon } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // You can log to your error reporting service here
      console.error('Production error:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Paper sx={{ p: 3, m: 2, border: '1px solid #ffcdd2' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              <BugReportIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Something went wrong
            </Typography>
          </Alert>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            An error occurred while rendering this component. This might be due to:
          </Typography>
          
          <Box component="ul" sx={{ pl: 2, mb: 2 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              Network connectivity issues
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Google Maps API loading problems
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Component state corruption
            </Typography>
          </Box>

          {this.state.error && (
            <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="caption" color="error" component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>
                {this.state.error.message}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={this.handleReset}
              size="small"
            >
              Try Again
            </Button>
            
            <Button
              variant="contained"
              onClick={this.handleReload}
              size="small"
            >
              Reload Page
            </Button>
          </Box>

          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>
                Component Stack:
                {this.state.errorInfo.componentStack}
              </Typography>
            </Box>
          )}
        </Paper>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
