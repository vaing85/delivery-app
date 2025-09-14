import { useEffect, useRef, useCallback } from 'react';
import { performanceMonitor, recordComponentRender, startTiming } from '@/utils/performance';

// Hook for tracking component performance
export const useComponentPerformance = (componentName: string) => {
  const renderStartTime = useRef<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    recordComponentRender(componentName, renderTime);
  });
};

// Hook for tracking API performance
export const useAPIPerformance = () => {
  const trackAPICall = useCallback((endpoint: string, duration: number) => {
    performanceMonitor.recordAPIResponseTime(endpoint, duration);
  }, []);

  const trackAPICallWithTiming = useCallback((endpoint: string) => {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      trackAPICall(endpoint, duration);
    };
  }, [trackAPICall]);

  return {
    trackAPICall,
    trackAPICallWithTiming
  };
};

// Hook for tracking user interaction performance
export const useInteractionPerformance = () => {
  const trackClick = useCallback((elementName: string) => {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      performanceMonitor.recordMetric(`click_${elementName}`, duration);
    };
  }, []);

  const trackFormSubmit = useCallback((formName: string) => {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      performanceMonitor.recordMetric(`form_submit_${formName}`, duration);
    };
  }, []);

  const trackNavigation = useCallback((from: string, to: string) => {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      performanceMonitor.recordMetric('navigation', duration, 'ms', { from, to });
    };
  }, []);

  return {
    trackClick,
    trackFormSubmit,
    trackNavigation
  };
};

// Hook for tracking page performance
export const usePagePerformance = () => {
  useEffect(() => {
    // Record page load metrics
    const recordPageMetrics = () => {
      performanceMonitor.recordMemoryUsage();
      performanceMonitor.recordNetworkInfo();
    };

    // Record metrics on page load
    if (document.readyState === 'complete') {
      recordPageMetrics();
    } else {
      window.addEventListener('load', recordPageMetrics);
    }

    // Record metrics on page visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        performanceMonitor.recordMemoryUsage();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('load', recordPageMetrics);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
};

// Hook for tracking scroll performance
export const useScrollPerformance = () => {
  const scrollStartTime = useRef<number>(0);
  const isScrolling = useRef<boolean>(false);

  useEffect(() => {
    const handleScrollStart = () => {
      if (!isScrolling.current) {
        scrollStartTime.current = performance.now();
        isScrolling.current = true;
      }
    };

    const handleScrollEnd = () => {
      if (isScrolling.current) {
        const duration = performance.now() - scrollStartTime.current;
        performanceMonitor.recordMetric('scroll_duration', duration);
        isScrolling.current = false;
      }
    };

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      handleScrollStart();
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScrollEnd, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);
};

// Hook for tracking resize performance
export const useResizePerformance = () => {
  useEffect(() => {
    const handleResize = () => {
      const startTime = performance.now();
      requestAnimationFrame(() => {
        const duration = performance.now() - startTime;
        performanceMonitor.recordMetric('resize_duration', duration);
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
};

// Hook for tracking animation performance
export const useAnimationPerformance = () => {
  const trackAnimation = useCallback((animationName: string) => {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      performanceMonitor.recordMetric(`animation_${animationName}`, duration);
    };
  }, []);

  return { trackAnimation };
};

// Hook for tracking search performance
export const useSearchPerformance = () => {
  const trackSearch = useCallback((query: string, resultsCount: number) => {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      performanceMonitor.recordMetric('search_duration', duration, 'ms', {
        query: query.substring(0, 50),
        resultsCount
      });
    };
  }, []);

  const trackSearchResultClick = useCallback((query: string, resultIndex: number) => {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      performanceMonitor.recordMetric('search_result_click', duration, 'ms', {
        query: query.substring(0, 50),
        resultIndex
      });
    };
  }, []);

  return {
    trackSearch,
    trackSearchResultClick
  };
};

// Hook for tracking modal performance
export const useModalPerformance = () => {
  const trackModalOpen = useCallback((modalName: string) => {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      performanceMonitor.recordMetric(`modal_open_${modalName}`, duration);
    };
  }, []);

  const trackModalClose = useCallback((modalName: string) => {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      performanceMonitor.recordMetric(`modal_close_${modalName}`, duration);
    };
  }, []);

  return {
    trackModalOpen,
    trackModalClose
  };
};

// Hook for tracking tab performance
export const useTabPerformance = () => {
  const trackTabSwitch = useCallback((tabName: string) => {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      performanceMonitor.recordMetric(`tab_switch_${tabName}`, duration);
    };
  }, []);

  return { trackTabSwitch };
};

// Hook for tracking infinite scroll performance
export const useInfiniteScrollPerformance = () => {
  const trackLoadMore = useCallback((page: number) => {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      performanceMonitor.recordMetric('infinite_scroll_load', duration, 'ms', { page });
    };
  }, []);

  return { trackLoadMore };
};

// Hook for tracking image loading performance
export const useImagePerformance = () => {
  const trackImageLoad = useCallback((imageSrc: string) => {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      performanceMonitor.recordMetric('image_load', duration, 'ms', {
        src: imageSrc.substring(0, 100)
      });
    };
  }, []);

  return { trackImageLoad };
};

// Hook for tracking lazy loading performance
export const useLazyLoadPerformance = () => {
  const trackLazyLoad = useCallback((elementName: string) => {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      performanceMonitor.recordMetric(`lazy_load_${elementName}`, duration);
    };
  }, []);

  return { trackLazyLoad };
};
