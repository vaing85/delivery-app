// Frontend Analytics and Monitoring Utilities

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
  userId?: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private isEnabled: boolean = true;

  constructor() {
    this.initializePerformanceObserver();
    this.initializeErrorTracking();
    this.initializeUserInteractionTracking();
  }

  // Track custom events
  track(event: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return;

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      userId: this.getCurrentUserId(),
    };

    this.events.push(analyticsEvent);
    this.sendEvent(analyticsEvent);
  }

  // Track page views
  trackPageView(page: string, properties?: Record<string, any>) {
    this.track('page_view', {
      page,
      ...properties,
    });
  }

  // Track user actions
  trackUserAction(action: string, element?: string, properties?: Record<string, any>) {
    this.track('user_action', {
      action,
      element,
      ...properties,
    });
  }

  // Track API calls
  trackAPICall(method: string, endpoint: string, statusCode: number, duration: number) {
    this.track('api_call', {
      method,
      endpoint,
      statusCode,
      duration,
      success: statusCode >= 200 && statusCode < 400,
    });
  }

  // Track errors
  trackError(error: Error, context?: string, properties?: Record<string, any>) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      context,
      ...properties,
    });
  }

  // Track performance metrics
  trackPerformance(name: string, value: number, unit: string = 'ms') {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
    };

    this.performanceMetrics.push(metric);
    this.sendPerformanceMetric(metric);
  }

  // Initialize performance observer
  private initializePerformanceObserver() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    // Observe navigation timing
    const navObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          this.trackPerformance('page_load_time', navEntry.loadEventEnd - navEntry.loadEventStart);
          this.trackPerformance('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart);
          this.trackPerformance('first_paint', navEntry.loadEventEnd - navEntry.fetchStart);
        }
      });
    });

    try {
      navObserver.observe({ entryTypes: ['navigation'] });
    } catch (error) {
      console.warn('PerformanceObserver not supported:', error);
    }

    // Observe resource timing
    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          this.trackPerformance('resource_load_time', resourceEntry.duration, 'ms');
        }
      });
    });

    try {
      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Resource PerformanceObserver not supported:', error);
    }
  }

  // Initialize error tracking
  private initializeErrorTracking() {
    // Track unhandled errors
    window.addEventListener('error', (event) => {
      this.trackError(event.error, 'unhandled_error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(event.reason), 'unhandled_promise_rejection');
    });
  }

  // Initialize user interaction tracking
  private initializeUserInteractionTracking() {
    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target) {
        this.trackUserAction('click', target.tagName.toLowerCase(), {
          id: target.id,
          className: target.className,
          text: target.textContent?.substring(0, 100),
        });
      }
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      if (form) {
        this.trackUserAction('form_submit', 'form', {
          id: form.id,
          className: form.className,
          action: form.action,
        });
      }
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.track('page_visibility_change', {
        hidden: document.hidden,
        visibilityState: document.visibilityState,
      });
    });
  }

  // Send event to analytics service
  private sendEvent(event: AnalyticsEvent) {
    // In a real application, you would send this to your analytics service
    // For now, we'll just log it
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', event);
    }

    // Example: Send to external analytics service
    // fetch('/api/analytics/events', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event),
    // }).catch(error => console.error('Failed to send analytics event:', error));
  }

  // Send performance metric
  private sendPerformanceMetric(metric: PerformanceMetric) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Metric:', metric);
    }

    // Example: Send to external monitoring service
    // fetch('/api/analytics/performance', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(metric),
    // }).catch(error => console.error('Failed to send performance metric:', error));
  }

  // Get current user ID
  private getCurrentUserId(): string | undefined {
    // This would typically come from your auth store
    try {
      const authData = localStorage.getItem('auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.user?.id;
      }
    } catch (error) {
      console.warn('Failed to get user ID for analytics:', error);
    }
    return undefined;
  }

  // Get analytics data
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  getPerformanceMetrics(): PerformanceMetric[] {
    return [...this.performanceMetrics];
  }

  // Clear analytics data
  clear() {
    this.events = [];
    this.performanceMetrics = [];
  }

  // Enable/disable analytics
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // Track component render performance
  trackComponentRender(componentName: string, renderTime: number) {
    this.trackPerformance(`component_render_${componentName}`, renderTime);
  }

  // Track API response times
  trackAPIResponseTime(endpoint: string, duration: number) {
    this.trackPerformance(`api_response_${endpoint}`, duration);
  }

  // Track user session
  trackSessionStart() {
    this.track('session_start', {
      sessionId: this.generateSessionId(),
      timestamp: Date.now(),
    });
  }

  trackSessionEnd() {
    this.track('session_end', {
      timestamp: Date.now(),
    });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Create singleton instance
export const analytics = new AnalyticsService();

// Export individual functions for convenience
export const trackEvent = (event: string, properties?: Record<string, any>) => {
  analytics.track(event, properties);
};

export const trackPageView = (page: string, properties?: Record<string, any>) => {
  analytics.trackPageView(page, properties);
};

export const trackUserAction = (action: string, element?: string, properties?: Record<string, any>) => {
  analytics.trackUserAction(action, element, properties);
};

export const trackError = (error: Error, context?: string, properties?: Record<string, any>) => {
  analytics.trackError(error, context, properties);
};

export const trackPerformance = (name: string, value: number, unit?: string) => {
  analytics.trackPerformance(name, value, unit);
};

export default analytics;
