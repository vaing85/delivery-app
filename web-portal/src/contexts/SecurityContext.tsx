import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { securityMiddleware, RateLimitResult } from '@/middleware/securityMiddleware';
import { useOffline } from '@/services/offlineService';

interface SecurityContextType {
  // Rate limiting
  checkRateLimit: (identifier: string) => RateLimitResult;
  isRateLimited: (identifier: string) => boolean;
  
  // CSRF protection
  generateCSRFToken: (sessionId: string) => string;
  validateCSRFToken: (sessionId: string, token: string) => boolean;
  
  // Security headers
  getSecurityHeaders: () => Record<string, string>;
  
  // Security status
  isSecure: boolean;
  securityScore: number;
  lastSecurityCheck: Date | null;
  
  // Security events
  logSecurityEvent: (event: SecurityEvent) => void;
  getSecurityEvents: () => SecurityEvent[];
  
  // Input validation
  validateInput: (input: any, rules: any) => any;
  
  // Security recommendations
  getSecurityRecommendations: () => string[];
}

interface SecurityEvent {
  id: string;
  type: 'rate_limit' | 'csrf_attack' | 'xss_attempt' | 'invalid_input' | 'suspicious_activity';
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: React.ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [securityScore, setSecurityScore] = useState(100);
  const [lastSecurityCheck, setLastSecurityCheck] = useState<Date | null>(null);
  const [isSecure, setIsSecure] = useState(true);
  
  const { isOffline } = useOffline();

  // Log security events
  const logSecurityEvent = useCallback((event: Omit<SecurityEvent, 'id' | 'timestamp'>) => {
    const securityEvent: SecurityEvent = {
      ...event,
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    
    setSecurityEvents(prev => [securityEvent, ...prev.slice(0, 99)]); // Keep last 100 events
    
    // Update security score based on event severity
    const scorePenalty = {
      low: 1,
      medium: 3,
      high: 7,
      critical: 15,
    }[event.severity];
    
    setSecurityScore(prev => Math.max(0, prev - scorePenalty));
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Security Event:', securityEvent);
    }
  }, []);

  // Check rate limiting
  const checkRateLimit = useCallback((identifier: string): RateLimitResult => {
    const result = securityMiddleware.checkRateLimit(identifier);
    
    if (!result.allowed) {
      logSecurityEvent({
        type: 'rate_limit',
        message: `Rate limit exceeded for ${identifier}`,
        severity: 'medium',
        metadata: { identifier, remaining: result.remaining },
      });
    }
    
    return result;
  }, [logSecurityEvent]);

  // Check if rate limited
  const isRateLimited = useCallback((identifier: string): boolean => {
    return !checkRateLimit(identifier).allowed;
  }, [checkRateLimit]);

  // Generate CSRF token
  const generateCSRFToken = useCallback((sessionId: string): string => {
    return securityMiddleware.generateCSRFToken(sessionId);
  }, []);

  // Validate CSRF token
  const validateCSRFToken = useCallback((sessionId: string, token: string): boolean => {
    const isValid = securityMiddleware.validateCSRFToken(sessionId, token);
    
    if (!isValid) {
      logSecurityEvent({
        type: 'csrf_attack',
        message: 'Invalid CSRF token detected',
        severity: 'high',
        metadata: { sessionId, token: token.substring(0, 8) + '...' },
      });
    }
    
    return isValid;
  }, [logSecurityEvent]);

  // Get security headers
  const getSecurityHeaders = useCallback(() => {
    return securityMiddleware.getSecurityHeaders();
  }, []);

  // Validate input
  const validateInput = useCallback((input: any, rules: any) => {
    try {
      return securityMiddleware.validateRequest(input, rules);
    } catch (error) {
      logSecurityEvent({
        type: 'invalid_input',
        message: 'Input validation failed',
        severity: 'medium',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
      
      return {
        valid: false,
        errors: ['Input validation failed'],
        data: input,
      };
    }
  }, [logSecurityEvent]);

  // Get security events
  const getSecurityEvents = useCallback(() => {
    return securityEvents;
  }, [securityEvents]);

  // Get security recommendations
  const getSecurityRecommendations = useCallback((): string[] => {
    const recommendations: string[] = [];
    
    if (securityScore < 80) {
      recommendations.push('Security score is low. Review recent security events.');
    }
    
    if (isOffline) {
      recommendations.push('You are offline. Some security features may be limited.');
    }
    
    const recentEvents = securityEvents.filter(
      event => Date.now() - event.timestamp.getTime() < 24 * 60 * 60 * 1000
    );
    
    if (recentEvents.length > 10) {
      recommendations.push('High number of security events in the last 24 hours.');
    }
    
    const criticalEvents = recentEvents.filter(event => event.severity === 'critical');
    if (criticalEvents.length > 0) {
      recommendations.push('Critical security events detected. Immediate attention required.');
    }
    
    return recommendations;
  }, [securityScore, isOffline, securityEvents]);

  // Security monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setLastSecurityCheck(new Date());
      
      // Check for suspicious patterns
      const recentEvents = securityEvents.filter(
        event => Date.now() - event.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
      );
      
      if (recentEvents.length > 20) {
        logSecurityEvent({
          type: 'suspicious_activity',
          message: 'High frequency of security events detected',
          severity: 'high',
          metadata: { eventCount: recentEvents.length },
        });
      }
      
      // Update security status
      setIsSecure(securityScore > 70);
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [securityEvents, securityScore, logSecurityEvent]);

  // Reset security score over time
  useEffect(() => {
    const interval = setInterval(() => {
      setSecurityScore(prev => Math.min(100, prev + 1)); // Increase by 1 every hour
    }, 60 * 60 * 1000); // Every hour
    
    return () => clearInterval(interval);
  }, []);

  const value: SecurityContextType = {
    checkRateLimit,
    isRateLimited,
    generateCSRFToken,
    validateCSRFToken,
    getSecurityHeaders,
    isSecure,
    securityScore,
    lastSecurityCheck,
    logSecurityEvent,
    getSecurityEvents,
    validateInput,
    getSecurityRecommendations,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};

export default SecurityProvider;
