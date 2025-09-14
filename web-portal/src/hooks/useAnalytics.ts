import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics, trackPageView, trackUserAction, trackError } from '@/utils/analytics';

// Hook for tracking page views
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname, {
      search: location.search,
      hash: location.hash,
    });
  }, [location]);
};

// Hook for tracking component performance
export const usePerformanceTracking = (componentName: string) => {
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    const endTime = Date.now();
    const renderTime = endTime - startTime.current;
    
    analytics.trackComponentRender(componentName, renderTime);
  });
};

// Hook for tracking user interactions
export const useInteractionTracking = () => {
  const trackClick = (action: string, element?: string, properties?: Record<string, any>) => {
    trackUserAction(action, element, properties);
  };

  const trackFormSubmit = (formName: string, properties?: Record<string, any>) => {
    trackUserAction('form_submit', 'form', { formName, ...properties });
  };

  const trackButtonClick = (buttonName: string, properties?: Record<string, any>) => {
    trackUserAction('button_click', 'button', { buttonName, ...properties });
  };

  const trackLinkClick = (linkText: string, href: string, properties?: Record<string, any>) => {
    trackUserAction('link_click', 'link', { linkText, href, ...properties });
  };

  return {
    trackClick,
    trackFormSubmit,
    trackButtonClick,
    trackLinkClick,
  };
};

// Hook for tracking errors
export const useErrorTracking = () => {
  const trackError = (error: Error, context?: string, properties?: Record<string, any>) => {
    analytics.trackError(error, context, properties);
  };

  return { trackError };
};

// Hook for tracking API calls
export const useAPITracking = () => {
  const trackAPICall = (method: string, endpoint: string, statusCode: number, duration: number) => {
    analytics.trackAPICall(method, endpoint, statusCode, duration);
  };

  return { trackAPICall };
};

// Hook for tracking user session
export const useSessionTracking = () => {
  useEffect(() => {
    analytics.trackSessionStart();

    return () => {
      analytics.trackSessionEnd();
    };
  }, []);
};

// Hook for tracking component lifecycle
export const useComponentTracking = (componentName: string) => {
  useEffect(() => {
    analytics.track('component_mount', { componentName });
    
    return () => {
      analytics.track('component_unmount', { componentName });
    };
  }, [componentName]);
};

// Hook for tracking form interactions
export const useFormTracking = (formName: string) => {
  const trackFormStart = () => {
    analytics.track('form_start', { formName });
  };

  const trackFormComplete = (success: boolean, properties?: Record<string, any>) => {
    analytics.track('form_complete', { 
      formName, 
      success, 
      ...properties 
    });
  };

  const trackFormFieldChange = (fieldName: string, value: any) => {
    analytics.track('form_field_change', { 
      formName, 
      fieldName, 
      value: typeof value === 'string' ? value.substring(0, 100) : value 
    });
  };

  const trackFormValidation = (fieldName: string, isValid: boolean, errorMessage?: string) => {
    analytics.track('form_validation', { 
      formName, 
      fieldName, 
      isValid, 
      errorMessage 
    });
  };

  return {
    trackFormStart,
    trackFormComplete,
    trackFormFieldChange,
    trackFormValidation,
  };
};

// Hook for tracking search interactions
export const useSearchTracking = () => {
  const trackSearch = (query: string, resultsCount: number, filters?: Record<string, any>) => {
    analytics.track('search', { 
      query, 
      resultsCount, 
      filters 
    });
  };

  const trackSearchResultClick = (query: string, resultIndex: number, resultId: string) => {
    analytics.track('search_result_click', { 
      query, 
      resultIndex, 
      resultId 
    });
  };

  const trackSearchFilter = (filterName: string, filterValue: any) => {
    analytics.track('search_filter', { 
      filterName, 
      filterValue 
    });
  };

  return {
    trackSearch,
    trackSearchResultClick,
    trackSearchFilter,
  };
};

// Hook for tracking navigation
export const useNavigationTracking = () => {
  const trackNavigation = (from: string, to: string, method: 'click' | 'back' | 'forward' | 'programmatic') => {
    analytics.track('navigation', { 
      from, 
      to, 
      method 
    });
  };

  const trackTabSwitch = (tabName: string) => {
    analytics.track('tab_switch', { tabName });
  };

  const trackModalOpen = (modalName: string) => {
    analytics.track('modal_open', { modalName });
  };

  const trackModalClose = (modalName: string, method: 'close_button' | 'escape' | 'backdrop' | 'programmatic') => {
    analytics.track('modal_close', { modalName, method });
  };

  return {
    trackNavigation,
    trackTabSwitch,
    trackModalOpen,
    trackModalClose,
  };
};
