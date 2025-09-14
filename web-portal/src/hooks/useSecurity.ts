import { useState, useEffect, useCallback } from 'react';
import { 
  validatePassword, 
  validateEmail, 
  validateUsername, 
  validateFile,
  createRateLimiter,
  secureStorage,
  validateSession
} from '@/utils/security';

// Hook for password validation
export const usePasswordValidation = (password: string) => {
  const [validation, setValidation] = useState(() => validatePassword(password));

  useEffect(() => {
    setValidation(validatePassword(password));
  }, [password]);

  return validation;
};

// Hook for email validation
export const useEmailValidation = (email: string) => {
  const [validation, setValidation] = useState(() => validateEmail(email));

  useEffect(() => {
    setValidation(validateEmail(email));
  }, [email]);

  return validation;
};

// Hook for username validation
export const useUsernameValidation = (username: string) => {
  const [validation, setValidation] = useState(() => validateUsername(username));

  useEffect(() => {
    setValidation(validateUsername(username));
  }, [username]);

  return validation;
};

// Hook for file validation
export const useFileValidation = (file: File | null) => {
  const [validation, setValidation] = useState(() => 
    file ? validateFile(file) : { isValid: true, errors: [] }
  );

  useEffect(() => {
    setValidation(file ? validateFile(file) : { isValid: true, errors: [] });
  }, [file]);

  return validation;
};

// Hook for rate limiting
export const useRateLimit = (maxRequests: number, windowMs: number) => {
  const rateLimiter = useCallback(() => createRateLimiter(maxRequests, windowMs), [maxRequests, windowMs]);
  const [isLimited, setIsLimited] = useState(false);

  const checkRateLimit = useCallback((key: string) => {
    const limiter = rateLimiter();
    const allowed = limiter(key);
    setIsLimited(!allowed);
    return allowed;
  }, [rateLimiter]);

  return { checkRateLimit, isLimited };
};

// Hook for secure storage
export const useSecureStorage = () => {
  const setSecureItem = useCallback((key: string, value: any) => {
    secureStorage.setItem(key, value);
  }, []);

  const getSecureItem = useCallback((key: string) => {
    return secureStorage.getItem(key);
  }, []);

  const removeSecureItem = useCallback((key: string) => {
    secureStorage.removeItem(key);
  }, []);

  const clearSecureStorage = useCallback(() => {
    secureStorage.clear();
  }, []);

  return {
    setSecureItem,
    getSecureItem,
    removeSecureItem,
    clearSecureStorage
  };
};

// Hook for session management
export const useSession = () => {
  const [session, setSession] = useState<{ isValid: boolean; userId?: string }>({ isValid: false });

  const validateCurrentSession = useCallback(() => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      const validation = validateSession(sessionId);
      setSession(validation);
      return validation.isValid;
    }
    return false;
  }, []);

  const createSession = useCallback((userId: string) => {
    const sessionId = crypto.randomUUID();
    const sessionData = {
      userId,
      expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
      createdAt: Date.now()
    };
    
    secureStorage.setItem('sessionId', sessionId);
    secureStorage.setItem(`session_${sessionId}`, sessionData);
    
    setSession({ isValid: true, userId });
  }, []);

  const destroySession = useCallback(() => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      secureStorage.removeItem(`session_${sessionId}`);
      secureStorage.removeItem('sessionId');
    }
    setSession({ isValid: false });
  }, []);

  useEffect(() => {
    validateCurrentSession();
  }, [validateCurrentSession]);

  return {
    session,
    validateCurrentSession,
    createSession,
    destroySession
  };
};

// Hook for input sanitization
export const useInputSanitization = () => {
  const sanitizeInput = useCallback((input: string) => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }, []);

  const sanitizeHTML = useCallback((html: string) => {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }, []);

  return {
    sanitizeInput,
    sanitizeHTML
  };
};

// Hook for form security
export const useFormSecurity = () => {
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  const recordAttempt = useCallback(() => {
    setAttempts(prev => {
      const newAttempts = prev + 1;
      if (newAttempts >= 5) {
        setIsBlocked(true);
        setTimeout(() => {
          setIsBlocked(false);
          setAttempts(0);
        }, 15 * 60 * 1000); // 15 minutes
      }
      return newAttempts;
    });
  }, []);

  const resetAttempts = useCallback(() => {
    setAttempts(0);
    setIsBlocked(false);
  }, []);

  return {
    attempts,
    isBlocked,
    recordAttempt,
    resetAttempts
  };
};

// Hook for file upload security
export const useFileUploadSecurity = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [totalSize, setTotalSize] = useState(0);

  const addFile = useCallback((file: File) => {
    const validation = validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    const newTotalSize = totalSize + file.size;
    if (newTotalSize > 50 * 1024 * 1024) { // 50MB total limit
      throw new Error('Total file size exceeds limit');
    }

    setUploadedFiles(prev => [...prev, file]);
    setTotalSize(newTotalSize);
  }, [totalSize]);

  const removeFile = useCallback((index: number) => {
    setUploadedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      const newTotalSize = newFiles.reduce((sum, file) => sum + file.size, 0);
      setTotalSize(newTotalSize);
      return newFiles;
    });
  }, []);

  const clearFiles = useCallback(() => {
    setUploadedFiles([]);
    setTotalSize(0);
  }, []);

  return {
    uploadedFiles,
    totalSize,
    addFile,
    removeFile,
    clearFiles
  };
};

// Hook for CSRF protection
export const useCSRFProtection = () => {
  const [csrfToken, setCsrfToken] = useState<string>('');

  const generateToken = useCallback(() => {
    const token = crypto.randomUUID();
    setCsrfToken(token);
    return token;
  }, []);

  const validateToken = useCallback((token: string) => {
    return token === csrfToken && token.length > 0;
  }, [csrfToken]);

  useEffect(() => {
    generateToken();
  }, [generateToken]);

  return {
    csrfToken,
    generateToken,
    validateToken
  };
};

// Hook for security monitoring
export const useSecurityMonitoring = () => {
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);

  const logSecurityEvent = useCallback((event: string, details: any) => {
    const securityEvent = {
      event,
      details,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    setSecurityEvents(prev => [...prev, securityEvent]);

    // Send to security monitoring service
    if (process.env.NODE_ENV === 'production') {
      // fetch('/api/security/events', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(securityEvent)
      // }).catch(error => console.error('Failed to log security event:', error));
    }
  }, []);

  const clearSecurityEvents = useCallback(() => {
    setSecurityEvents([]);
  }, []);

  return {
    securityEvents,
    logSecurityEvent,
    clearSecurityEvents
  };
};

// Hook for content security policy
export const useCSP = () => {
  const [cspViolations, setCspViolations] = useState<any[]>([]);

  useEffect(() => {
    const handleCSPViolation = (event: any) => {
      const violation = {
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        originalPolicy: event.originalPolicy,
        timestamp: Date.now()
      };

      setCspViolations(prev => [...prev, violation]);
    };

    document.addEventListener('securitypolicyviolation', handleCSPViolation);

    return () => {
      document.removeEventListener('securitypolicyviolation', handleCSPViolation);
    };
  }, []);

  const clearViolations = useCallback(() => {
    setCspViolations([]);
  }, []);

  return {
    cspViolations,
    clearViolations
  };
};
