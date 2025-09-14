import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Typography,
  Paper,
} from '@mui/material';
import { securityMiddleware, ValidationRules } from '@/middleware/securityMiddleware';
import { useOffline } from '@/services/offlineService';

interface SecureFormProps {
  fields: FormField[];
  onSubmit: (data: any) => Promise<void>;
  submitLabel?: string;
  validationRules: ValidationRules;
  className?: string;
  disabled?: boolean;
  showSecurityIndicator?: boolean;
}

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'phone' | 'url' | 'select' | 'textarea' | 'file';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}

const SecureForm: React.FC<SecureFormProps> = ({
  fields,
  onSubmit,
  submitLabel = 'Submit',
  validationRules,
  className,
  disabled = false,
  showSecurityIndicator = true,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement>>({});
  
  const { isOffline, storeOfflineAction } = useOffline();

  const handleInputChange = useCallback((fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }));
    
    // Clear field error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: '',
      }));
    }
  }, [errors]);

  const handleFileChange = useCallback((fieldName: string, file: File | null) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: file,
    }));
    
    // Clear field error when user selects a file
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: '',
      }));
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const validation = securityMiddleware.validateRequest(formData, validationRules);
    
    if (!validation.valid) {
      const fieldErrors: Record<string, string> = {};
      
      validation.errors.forEach(error => {
        const [fieldName] = error.split(':');
        fieldErrors[fieldName] = error;
      });
      
      setErrors(fieldErrors);
      return false;
    }
    
    setErrors({});
    return true;
  }, [formData, validationRules]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (disabled || isSubmitting) return;
    
    setSubmitError(null);
    setSubmitSuccess(false);
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isOffline) {
        // Store for offline processing
        await storeOfflineAction('FORM_SUBMIT', {
          formData,
          timestamp: Date.now(),
        });
        
        setSubmitSuccess(true);
        setFormData({});
      } else {
        // Submit immediately
        await onSubmit(formData);
        setSubmitSuccess(true);
        setFormData({});
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validationRules, disabled, isSubmitting, validateForm, onSubmit, isOffline, storeOfflineAction]);

  const renderField = (field: FormField) => {
    const fieldError = errors[field.name];
    const value = formData[field.name] || '';

    switch (field.type) {
      case 'select':
        return (
          <FormControl key={field.name} fullWidth error={!!fieldError} required={field.required}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              label={field.label}
            >
              {field.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {fieldError && <FormHelperText>{fieldError}</FormHelperText>}
          </FormControl>
        );

      case 'file':
        return (
          <Box key={field.name} sx={{ mb: 2 }}>
            <input
              ref={(el) => {
                if (el) fileInputRefs.current[field.name] = el;
              }}
              type="file"
              onChange={(e) => handleFileChange(field.name, e.target.files?.[0] || null)}
              style={{ display: 'none' }}
              accept={field.options?.map(opt => opt.value).join(',')}
            />
            <Button
              variant="outlined"
              component="span"
              onClick={() => fileInputRefs.current[field.name]?.click()}
              fullWidth
              error={!!fieldError}
            >
              {value ? value.name : `Choose ${field.label}`}
            </Button>
            {fieldError && (
              <FormHelperText error sx={{ mt: 1 }}>
                {fieldError}
              </FormHelperText>
            )}
          </Box>
        );

      case 'textarea':
        return (
          <TextField
            key={field.name}
            fullWidth
            label={field.label}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            error={!!fieldError}
            helperText={fieldError}
            required={field.required}
            multiline={field.multiline}
            rows={field.rows || 4}
            placeholder={field.placeholder}
            sx={{ mb: 2 }}
          />
        );

      default:
        return (
          <TextField
            key={field.name}
            fullWidth
            type={field.type}
            label={field.label}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            error={!!fieldError}
            helperText={fieldError}
            required={field.required}
            placeholder={field.placeholder}
            sx={{ mb: 2 }}
          />
        );
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {showSecurityIndicator && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            🔒 Secure Form
          </Typography>
          {isOffline && (
            <Typography variant="caption" color="warning.main">
              (Offline Mode)
            </Typography>
          )}
        </Box>
      )}

      <form onSubmit={handleSubmit} className={className}>
        {fields.map(renderField)}
        
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}
        
        {submitSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {isOffline 
              ? 'Form saved for offline processing. It will be submitted when you reconnect.'
              : 'Form submitted successfully!'
            }
          </Alert>
        )}
        
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={disabled || isSubmitting}
          sx={{ mt: 2 }}
        >
          {isSubmitting ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              {isOffline ? 'Saving...' : 'Submitting...'}
            </Box>
          ) : (
            submitLabel
          )}
        </Button>
      </form>
    </Paper>
  );
};

export default SecureForm;
