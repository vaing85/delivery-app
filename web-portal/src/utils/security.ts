// Frontend Security Utilities

interface SecurityConfig {
  maxPasswordLength: number;
  minPasswordLength: number;
  maxUsernameLength: number;
  minUsernameLength: number;
  maxEmailLength: number;
  allowedFileTypes: string[];
  maxFileSize: number;
  maxRequestSize: number;
  sessionTimeout: number;
  maxLoginAttempts: number;
}

const securityConfig: SecurityConfig = {
  maxPasswordLength: 128,
  minPasswordLength: 8,
  maxUsernameLength: 50,
  minUsernameLength: 2,
  maxEmailLength: 254,
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxRequestSize: 5 * 1024 * 1024, // 5MB
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  maxLoginAttempts: 5
};

// Input sanitization
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:/gi, '')
    .trim();
};

// XSS protection
export const sanitizeHTML = (html: string): string => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

// SQL injection protection
export const sanitizeForSQL = (input: string): string => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(\b(OR|AND)\s+'.*'\s*=\s*'.*')/gi,
    /(\b(OR|AND)\s+".*"\s*=\s*".*")/gi,
    /(UNION\s+SELECT)/gi,
    /(DROP\s+TABLE)/gi,
    /(DELETE\s+FROM)/gi,
    /(INSERT\s+INTO)/gi,
    /(UPDATE\s+SET)/gi
  ];

  let sanitized = input;
  sqlPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  return sanitized;
};

// Password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < securityConfig.minPasswordLength) {
    errors.push(`Password must be at least ${securityConfig.minPasswordLength} characters long`);
  }

  if (password.length > securityConfig.maxPasswordLength) {
    errors.push(`Password must be no more than ${securityConfig.maxPasswordLength} characters long`);
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common passwords
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common, please choose a stronger password');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Email validation
export const validateEmail = (email: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!email) {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  if (email.length > securityConfig.maxEmailLength) {
    errors.push(`Email must be no more than ${securityConfig.maxEmailLength} characters long`);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
  }

  // Check for suspicious patterns
  if (email.includes('..') || email.includes('--')) {
    errors.push('Email contains invalid characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Username validation
export const validateUsername = (username: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!username) {
    errors.push('Username is required');
    return { isValid: false, errors };
  }

  if (username.length < securityConfig.minUsernameLength) {
    errors.push(`Username must be at least ${securityConfig.minUsernameLength} characters long`);
  }

  if (username.length > securityConfig.maxUsernameLength) {
    errors.push(`Username must be no more than ${securityConfig.maxUsernameLength} characters long`);
  }

  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens');
  }

  // Check for reserved usernames
  const reservedUsernames = [
    'admin', 'administrator', 'root', 'user', 'guest', 'test',
    'api', 'www', 'mail', 'ftp', 'support', 'help', 'info'
  ];

  if (reservedUsernames.includes(username.toLowerCase())) {
    errors.push('This username is reserved');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// File validation
export const validateFile = (file: File): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!file) {
    errors.push('File is required');
    return { isValid: false, errors };
  }

  if (file.size > securityConfig.maxFileSize) {
    errors.push(`File size must be no more than ${securityConfig.maxFileSize / 1024 / 1024}MB`);
  }

  if (!securityConfig.allowedFileTypes.includes(file.type)) {
    errors.push(`File type not allowed. Allowed types: ${securityConfig.allowedFileTypes.join(', ')}`);
  }

  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  
  if (!allowedExtensions.includes(fileExtension)) {
    errors.push(`File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`);
  }

  // Check for suspicious file names
  const suspiciousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.scr$/i,
    /\.pif$/i,
    /\.com$/i,
    /\.vbs$/i,
    /\.js$/i,
    /\.jar$/i
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
    errors.push('File type not allowed for security reasons');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// CSRF protection
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const validateCSRFToken = (token: string, storedToken: string): boolean => {
  return token === storedToken && token.length === 64;
};

// Session security
export const createSecureSession = (userId: string): { sessionId: string; expiresAt: number } => {
  const sessionId = generateCSRFToken();
  const expiresAt = Date.now() + securityConfig.sessionTimeout;
  
  // Store session in secure storage
  const sessionData = {
    userId,
    expiresAt,
    createdAt: Date.now()
  };
  
  sessionStorage.setItem(`session_${sessionId}`, JSON.stringify(sessionData));
  
  return { sessionId, expiresAt };
};

export const validateSession = (sessionId: string): { isValid: boolean; userId?: string } => {
  const sessionData = sessionStorage.getItem(`session_${sessionId}`);
  
  if (!sessionData) {
    return { isValid: false };
  }
  
  try {
    const session = JSON.parse(sessionData);
    
    if (Date.now() > session.expiresAt) {
      sessionStorage.removeItem(`session_${sessionId}`);
      return { isValid: false };
    }
    
    return { isValid: true, userId: session.userId };
  } catch (error) {
    return { isValid: false };
  }
};

// Content Security Policy
export const getCSPHeader = (): string => {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.deliveryapp.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; ');
};

// Secure storage
export const secureStorage = {
  setItem: (key: string, value: any): void => {
    try {
      const encrypted = btoa(JSON.stringify(value));
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Failed to store data securely:', error);
    }
  },
  
  getItem: (key: string): any => {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      
      const decrypted = JSON.parse(atob(encrypted));
      return decrypted;
    } catch (error) {
      console.error('Failed to retrieve data securely:', error);
      return null;
    }
  },
  
  removeItem: (key: string): void => {
    localStorage.removeItem(key);
  },
  
  clear: (): void => {
    localStorage.clear();
  }
};

// Input validation
export const validateInput = (input: any, type: 'string' | 'number' | 'email' | 'url'): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (type === 'string') {
    if (typeof input !== 'string') {
      errors.push('Input must be a string');
    } else if (input.length > 1000) {
      errors.push('Input is too long');
    }
  } else if (type === 'number') {
    if (typeof input !== 'number' || isNaN(input)) {
      errors.push('Input must be a valid number');
    }
  } else if (type === 'email') {
    const emailValidation = validateEmail(input);
    if (!emailValidation.isValid) {
      errors.push(...emailValidation.errors);
    }
  } else if (type === 'url') {
    try {
      new URL(input);
    } catch {
      errors.push('Input must be a valid URL');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Rate limiting (client-side)
export const createRateLimiter = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, number[]>();
  
  return (key: string): boolean => {
    const now = Date.now();
    const userRequests = requests.get(key) || [];
    
    // Remove old requests
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    requests.set(key, validRequests);
    
    return true;
  };
};

// Security headers
export const setSecurityHeaders = (): void => {
  // Set meta tags for security
  const metaTags = [
    { name: 'referrer', content: 'strict-origin-when-cross-origin' },
    { name: 'robots', content: 'noindex, nofollow' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }
  ];
  
  metaTags.forEach(tag => {
    let meta = document.querySelector(`meta[name="${tag.name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', tag.name);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', tag.content);
  });
};

// Export security configuration
export { securityConfig };