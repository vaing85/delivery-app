import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { toast } from 'react-toastify';
import { Alert, Snackbar, AlertTitle } from '@mui/material';

interface ErrorContextType {
  handleError: (error: any, context?: string) => void;
  handleApiError: (error: any, operation?: string) => void;
  showError: (message: string, details?: string) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const useErrorHandler = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorHandler must be used within an ErrorProvider');
  }
  return context;
};

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const getErrorMessage = (error: any): string => {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error?.response?.data?.error?.message) {
      return error.response.data.error.message;
    }
    
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    if (error?.response?.status) {
      switch (error.response.status) {
        case 400:
          return 'Invalid request. Please check your input.';
        case 401:
          return 'You are not authorized. Please log in again.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return 'The requested resource was not found.';
        case 409:
          return 'This action conflicts with existing data.';
        case 422:
          return 'Validation error. Please check your input.';
        case 429:
          return 'Too many requests. Please try again later.';
        case 500:
          return 'Server error. Please try again later.';
        case 502:
          return 'Service temporarily unavailable.';
        case 503:
          return 'Service is currently unavailable.';
        default:
          return 'An unexpected error occurred.';
      }
    }
    
    return 'An unexpected error occurred. Please try again.';
  };

  const getErrorDetails = (error: any): string | undefined => {
    if (error?.response?.data?.error?.details) {
      return error.response.data.error.details;
    }
    
    if (error?.response?.data?.details) {
      return error.response.data.details;
    }
    
    if (error?.stack && process.env.NODE_ENV === 'development') {
      return error.stack;
    }
    
    return undefined;
  };

  const handleError = useCallback((error: any, context?: string) => {
    const message = getErrorMessage(error);
    const details = getErrorDetails(error);
    
    console.error(`Error in ${context || 'unknown context'}:`, error);
    
    toast.error(
      <div>
        <div style={{ fontWeight: 'bold' }}>{message}</div>
        {details && (
          <div style={{ fontSize: '0.8rem', marginTop: '4px', opacity: 0.8 }}>
            {details}
          </div>
        )}
      </div>,
      {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
  }, []);

  const handleApiError = useCallback((error: any, operation?: string) => {
    const message = getErrorMessage(error);
    const details = getErrorDetails(error);
    
    console.error(`API Error during ${operation || 'unknown operation'}:`, error);
    
    // Show user-friendly error message
    toast.error(
      <div>
        <div style={{ fontWeight: 'bold' }}>
          {operation ? `Failed to ${operation}` : 'Operation failed'}
        </div>
        <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>{message}</div>
        {details && process.env.NODE_ENV === 'development' && (
          <div style={{ fontSize: '0.8rem', marginTop: '4px', opacity: 0.7 }}>
            {details}
          </div>
        )}
      </div>,
      {
        position: 'top-right',
        autoClose: 6000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
  }, []);

  const showError = useCallback((message: string, details?: string) => {
    toast.error(
      <div>
        <div style={{ fontWeight: 'bold' }}>{message}</div>
        {details && (
          <div style={{ fontSize: '0.8rem', marginTop: '4px', opacity: 0.8 }}>
            {details}
          </div>
        )}
      </div>,
      {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
  }, []);

  const showSuccess = useCallback((message: string) => {
    toast.success(message, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }, []);

  const showWarning = useCallback((message: string) => {
    toast.warning(message, {
      position: 'top-right',
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }, []);

  const showInfo = useCallback((message: string) => {
    toast.info(message, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }, []);

  const value: ErrorContextType = {
    handleError,
    handleApiError,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
};

export default ErrorProvider;
