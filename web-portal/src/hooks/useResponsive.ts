import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

export interface BreakpointValues {
  xs: boolean;
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
}

export interface ResponsiveConfig {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeScreen: boolean;
  breakpoints: BreakpointValues;
  orientation: 'portrait' | 'landscape';
  touchDevice: boolean;
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const useResponsive = (): ResponsiveConfig => {
  const theme = useTheme();
  
  // Breakpoint queries
  const xs = useMediaQuery(theme.breakpoints.only('xs'));
  const sm = useMediaQuery(theme.breakpoints.only('sm'));
  const md = useMediaQuery(theme.breakpoints.only('md'));
  const lg = useMediaQuery(theme.breakpoints.only('lg'));
  const xl = useMediaQuery(theme.breakpoints.up('xl'));
  
  // Device type queries
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('xl'));
  
  // Touch device detection
  const [touchDevice, setTouchDevice] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  
  useEffect(() => {
    // Touch device detection
    const checkTouchDevice = () => {
      setTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0
      );
    };
    
    // Orientation detection
    const checkOrientation = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };
    
    checkTouchDevice();
    checkOrientation();
    
    // Listen for orientation changes
    const handleOrientationChange = () => {
      setTimeout(checkOrientation, 100); // Small delay to ensure accurate measurement
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);
  
  // Determine current screen size
  const getScreenSize = (): 'xs' | 'sm' | 'md' | 'lg' | 'xl' => {
    if (xs) return 'xs';
    if (sm) return 'sm';
    if (md) return 'md';
    if (lg) return 'lg';
    if (xl) return 'xl';
    return 'md'; // fallback
  };
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeScreen,
    breakpoints: { xs, sm, md, lg, xl },
    orientation,
    touchDevice,
    screenSize: getScreenSize(),
  };
};

// Hook for mobile-specific interactions
export const useMobileInteractions = () => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  
  // Minimum distance for swipe detection
  const minSwipeDistance = 50;
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
    setIsScrolling(false);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const currentTouch = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
    
    setTouchEnd(currentTouch);
    
    // Detect if user is scrolling
    const deltaX = Math.abs(currentTouch.x - touchStart.x);
    const deltaY = Math.abs(currentTouch.y - touchStart.y);
    
    if (deltaY > deltaX) {
      setIsScrolling(true);
    }
  };
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || isScrolling) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;
    
    return {
      isLeftSwipe,
      isRightSwipe,
      isUpSwipe,
      isDownSwipe,
      isSwipe: isLeftSwipe || isRightSwipe || isUpSwipe || isDownSwipe,
      distanceX,
      distanceY,
    };
  };
  
  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isScrolling,
  };
};

// Hook for responsive values
export const useResponsiveValue = <T>(
  values: {
    xs?: T;
    sm?: T;
    md?: T;
    lg?: T;
    xl?: T;
  },
  defaultValue: T
): T => {
  const { screenSize } = useResponsive();
  
  switch (screenSize) {
    case 'xs':
      return values.xs ?? defaultValue;
    case 'sm':
      return values.sm ?? values.xs ?? defaultValue;
    case 'md':
      return values.md ?? values.sm ?? values.xs ?? defaultValue;
    case 'lg':
      return values.lg ?? values.md ?? values.sm ?? values.xs ?? defaultValue;
    case 'xl':
      return values.xl ?? values.lg ?? values.md ?? values.sm ?? values.xs ?? defaultValue;
    default:
      return defaultValue;
  }
};

export default useResponsive;
