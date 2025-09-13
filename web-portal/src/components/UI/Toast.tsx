import React from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

interface ToastProps {
  open: boolean;
  message: string;
  severity: AlertColor;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ open, message, severity, onClose }) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default Toast;
