// Frontend Performance Monitoring and Optimization Utilities

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  url: string;
  userAgent: string;
}

interface PerformanceObserver {
  observe: (options: PerformanceObserverInit) => void;
  disconnect: () => void;
  takeRecords: () => PerformanceEntry[];
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private isEnabled: boolean = true;

  constructor() {
    this.initializeObservers();
    this.initializeResourceTiming();
    this.initializeNavigationTiming();
    this.initializeUserTiming();
  }

  // Initialize performance observers
  private initializeObservers() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    // Observe navigation timing
    this.observeNavigationTiming();
    
    // Observe resource timing
    this.observeResourceTiming();
    
    // Observe long tasks
    this.observeLongTasks();
    
    // Observe layout shifts
    this.observeLayoutShifts();
    
    // Observe first input delay
    this.observeFirstInputDelay();
  }

  // Observe navigation timing
  private observeNavigationTiming() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          this.recordMetric('page_load_time', navEntry.loadEventEnd - navEntry.loadEventStart);
          this.recordMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart);
          this.recordMetric('first_paint', navEntry.loadEventEnd - navEntry.fetchStart);
          this.recordMetric('dns_lookup', navEntry.domainLookupEnd - navEntry.domainLookupStart);
          this.recordMetric('tcp_connection', navEntry.connectEnd - navEntry.connectStart);
          this.recordMetric('ssl_handshake', navEntry.secureConnectionStart > 0 ? navEntry.connectEnd - navEntry.secureConnectionStart : 0);
          this.recordMetric('ttfb', navEntry.responseStart - navEntry.requestStart);
          this.recordMetric('dom_processing', navEntry.domComplete - navEntry.domLoading);
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Navigation timing observer not supported:', error);
    }
  }

  // Observe resource timing
  private observeResourceTiming() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          this.recordMetric('resource_load_time', resourceEntry.duration);
          this.recordMetric('resource_size', resourceEntry.transferSize);
          
          // Log slow resources
          if (resourceEntry.duration > 1000) {
            this.recordMetric('slow_resource', resourceEntry.duration, 'ms', {
              name: resourceEntry.name,
              type: resourceEntry.initiatorType
            });
          }
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Resource timing observer not supported:', error);
    }
  }

  // Observe long tasks
  private observeLongTasks() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.recordMetric('long_task', entry.duration, 'ms', {
          name: entry.name,
          startTime: entry.startTime
        });
      });
    });

    try {
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Long task observer not supported:', error);
    }
  }

  // Observe layout shifts
  private observeLayoutShifts() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'layout-shift') {
          const layoutShiftEntry = entry as any;
          this.recordMetric('layout_shift', layoutShiftEntry.value, 'score', {
            hadRecentInput: layoutShiftEntry.hadRecentInput,
            sources: layoutShiftEntry.sources?.length || 0
          });
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Layout shift observer not supported:', error);
    }
  }

  // Observe first input delay
  private observeFirstInputDelay() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'first-input') {
          const firstInputEntry = entry as any;
          this.recordMetric('first_input_delay', firstInputEntry.processingStart - firstInputEntry.startTime);
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('First input delay observer not supported:', error);
    }
  }

  // Initialize resource timing
  private initializeResourceTiming() {
    if (typeof window === 'undefined') return;

    // Monitor resource loading
    window.addEventListener('load', () => {
      const resources = performance.getEntriesByType('resource');
      resources.forEach((resource) => {
        const resourceEntry = resource as PerformanceResourceTiming;
        this.recordMetric('resource_load_time', resourceEntry.duration);
      });
    });
  }

  // Initialize navigation timing
  private initializeNavigationTiming() {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.recordMetric('page_load_time', navigation.loadEventEnd - navigation.loadEventStart);
        this.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
        this.recordMetric('first_paint', navigation.loadEventEnd - navigation.fetchStart);
      }
    });
  }

  // Initialize user timing
  private initializeUserTiming() {
    if (typeof window === 'undefined') return;

    // Monitor user interactions
    document.addEventListener('click', (event) => {
      const startTime = performance.now();
      requestAnimationFrame(() => {
        const endTime = performance.now();
        this.recordMetric('click_response_time', endTime - startTime);
      });
    });

    // Monitor form submissions
    document.addEventListener('submit', (event) => {
      const startTime = performance.now();
      requestAnimationFrame(() => {
        const endTime = performance.now();
        this.recordMetric('form_submit_time', endTime - startTime);
      });
    });
  }

  // Record a performance metric
  recordMetric(name: string, value: number, unit: string = 'ms', metadata?: any) {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...metadata
    };

    this.metrics.push(metric);
    this.sendMetric(metric);
  }

  // Record custom timing
  recordTiming(name: string, startTime: number, endTime?: number) {
    const duration = endTime ? endTime - startTime : performance.now() - startTime;
    this.recordMetric(name, duration);
  }

  // Start a timing measurement
  startTiming(name: string): () => void {
    const startTime = performance.now();
    return () => {
      this.recordTiming(name, startTime);
    };
  }

  // Record component render time
  recordComponentRender(componentName: string, renderTime: number) {
    this.recordMetric(`component_render_${componentName}`, renderTime);
  }

  // Record API response time
  recordAPIResponseTime(endpoint: string, duration: number) {
    this.recordMetric(`api_response_${endpoint}`, duration);
  }

  // Record memory usage
  recordMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.recordMetric('memory_used', memory.usedJSHeapSize / 1024 / 1024, 'MB');
      this.recordMetric('memory_total', memory.totalJSHeapSize / 1024 / 1024, 'MB');
      this.recordMetric('memory_limit', memory.jsHeapSizeLimit / 1024 / 1024, 'MB');
    }
  }

  // Record network information
  recordNetworkInfo() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.recordMetric('connection_type', connection.effectiveType || 'unknown', 'string');
      this.recordMetric('connection_downlink', connection.downlink || 0, 'Mbps');
      this.recordMetric('connection_rtt', connection.rtt || 0, 'ms');
    }
  }

  // Send metric to analytics service
  private sendMetric(metric: PerformanceMetric) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Metric:', metric);
    }

    // Send to analytics service
    // fetch('/api/analytics/performance', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(metric),
    // }).catch(error => console.error('Failed to send performance metric:', error));
  }

  // Get performance metrics
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Get metrics by name
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  // Get average metric value
  getAverageMetric(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / metrics.length;
  }

  // Get performance summary
  getPerformanceSummary() {
    const summary = {
      totalMetrics: this.metrics.length,
      pageLoadTime: this.getAverageMetric('page_load_time'),
      domContentLoaded: this.getAverageMetric('dom_content_loaded'),
      firstPaint: this.getAverageMetric('first_paint'),
      longTasks: this.getMetricsByName('long_task').length,
      layoutShifts: this.getAverageMetric('layout_shift'),
      firstInputDelay: this.getAverageMetric('first_input_delay'),
      slowResources: this.getMetricsByName('slow_resource').length
    };

    return summary;
  }

  // Clear metrics
  clear() {
    this.metrics = [];
  }

  // Enable/disable monitoring
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // Disconnect observers
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export individual functions for convenience
export const recordMetric = (name: string, value: number, unit?: string, metadata?: any) => {
  performanceMonitor.recordMetric(name, value, unit, metadata);
};

export const recordTiming = (name: string, startTime: number, endTime?: number) => {
  performanceMonitor.recordTiming(name, startTime, endTime);
};

export const startTiming = (name: string) => {
  return performanceMonitor.startTiming(name);
};

export const recordComponentRender = (componentName: string, renderTime: number) => {
  performanceMonitor.recordComponentRender(componentName, renderTime);
};

export const recordAPIResponseTime = (endpoint: string, duration: number) => {
  performanceMonitor.recordAPIResponseTime(endpoint, duration);
};

export default performanceMonitor;
