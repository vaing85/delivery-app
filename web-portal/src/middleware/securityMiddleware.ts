import { 
  sanitizeInput, 
  validateEmail, 
  validatePhone, 
  validatePassword,
  validateInputLength,
  validateFileUpload,
  validateAndSanitizeURL,
  RateLimiter,
  CSRFProtection
} from '@/utils/security';

// Rate limiter instance
const rateLimiter = new RateLimiter(100, 15 * 60 * 1000); // 100 requests per 15 minutes

// Security middleware for API calls
export class SecurityMiddleware {
  private static instance: SecurityMiddleware;
  private requestCounts: Map<string, number> = new Map();

  static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware();
    }
    return SecurityMiddleware.instance;
  }

  // Validate and sanitize request data
  validateRequest(data: any, rules: ValidationRules): ValidationResult {
    const errors: string[] = [];
    const sanitizedData: any = {};

    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];
      
      // Check if field is required
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      // Skip validation if field is not provided and not required
      if (value === undefined || value === null || value === '') {
        sanitizedData[field] = value;
        continue;
      }

      // Sanitize input
      const sanitized = sanitizeInput(value);
      sanitizedData[field] = sanitized;

      // Validate length
      if (rule.minLength || rule.maxLength) {
        const lengthValidation = validateInputLength(
          sanitized,
          rule.minLength,
          rule.maxLength
        );
        
        if (!lengthValidation.valid) {
          errors.push(`${field}: ${lengthValidation.message}`);
        }
      }

      // Validate email
      if (rule.type === 'email' && !validateEmail(sanitized)) {
        errors.push(`${field} must be a valid email address`);
      }

      // Validate phone
      if (rule.type === 'phone' && !validatePhone(sanitized)) {
        errors.push(`${field} must be a valid phone number`);
      }

      // Validate password
      if (rule.type === 'password') {
        const passwordValidation = validatePassword(sanitized);
        if (!passwordValidation.valid) {
          errors.push(...passwordValidation.errors.map(err => `${field}: ${err}`));
        }
      }

      // Validate URL
      if (rule.type === 'url') {
        const urlValidation = validateAndSanitizeURL(sanitized);
        if (!urlValidation.valid) {
          errors.push(`${field}: ${urlValidation.error}`);
        } else {
          sanitizedData[field] = urlValidation.sanitized;
        }
      }

      // Validate file
      if (rule.type === 'file' && value instanceof File) {
        const fileValidation = validateFileUpload(value, rule.fileOptions);
        if (!fileValidation.valid) {
          errors.push(...fileValidation.errors.map(err => `${field}: ${err}`));
        }
      }

      // Validate custom pattern
      if (rule.pattern && !rule.pattern.test(sanitized)) {
        errors.push(`${field} format is invalid`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      data: sanitizedData,
    };
  }

  // Rate limiting check
  checkRateLimit(identifier: string): RateLimitResult {
    const isAllowed = rateLimiter.isAllowed(identifier);
    const remaining = rateLimiter.getRemainingRequests(identifier);
    const resetTime = rateLimiter.getResetTime(identifier);

    return {
      allowed: isAllowed,
      remaining,
      resetTime,
    };
  }

  // CSRF protection
  generateCSRFToken(sessionId: string): string {
    return CSRFProtection.generateToken(sessionId);
  }

  validateCSRFToken(sessionId: string, token: string): boolean {
    return CSRFProtection.validateToken(sessionId, token);
  }

  // Security headers
  getSecurityHeaders(): Record<string, string> {
    const nonce = this.generateNonce();
    
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': this.generateCSP(nonce),
      'X-Nonce': nonce,
    };
  }

  private generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private generateCSP(nonce: string): string {
    return [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://maps.googleapis.com wss: ws:",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ');
  }

  // Input sanitization for forms
  sanitizeFormData(formData: FormData): FormData {
    const sanitized = new FormData();
    
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        sanitized.append(key, sanitizeInput(value));
      } else {
        sanitized.append(key, value);
      }
    }
    
    return sanitized;
  }

  // Validate API response
  validateAPIResponse(response: any, expectedSchema: any): ValidationResult {
    const errors: string[] = [];
    
    // Basic response validation
    if (!response || typeof response !== 'object') {
      errors.push('Invalid response format');
      return { valid: false, errors, data: response };
    }

    // Check for required fields
    for (const field of expectedSchema.required || []) {
      if (!(field in response)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate field types
    for (const [field, type] of Object.entries(expectedSchema.properties || {})) {
      if (field in response) {
        const value = response[field];
        const expectedType = (type as any).type;
        
        if (expectedType === 'string' && typeof value !== 'string') {
          errors.push(`${field} must be a string`);
        } else if (expectedType === 'number' && typeof value !== 'number') {
          errors.push(`${field} must be a number`);
        } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
          errors.push(`${field} must be a boolean`);
        } else if (expectedType === 'array' && !Array.isArray(value)) {
          errors.push(`${field} must be an array`);
        } else if (expectedType === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
          errors.push(`${field} must be an object`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      data: response,
    };
  }
}

// Validation rules interface
export interface ValidationRules {
  [field: string]: {
    required?: boolean;
    type?: 'email' | 'phone' | 'password' | 'url' | 'file' | 'string' | 'number' | 'boolean';
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    fileOptions?: {
      maxSize?: number;
      allowedTypes?: string[];
      allowedExtensions?: string[];
    };
  };
}

// Validation result interface
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  data: any;
}

// Rate limit result interface
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

// Export singleton instance
export const securityMiddleware = SecurityMiddleware.getInstance();
