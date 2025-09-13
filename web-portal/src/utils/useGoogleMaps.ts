import { useState, useEffect, useCallback, useRef } from 'react';
import googleMapsManager from './googleMapsManager';
import { MAPS_CONFIG } from '@/config/maps';

interface UseGoogleMapsReturn {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

export const useGoogleMaps = (): UseGoogleMapsReturn => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const loadingRef = useRef(false);

  const checkForConflicts = useCallback(() => {
    const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
    if (existingScripts.length > 1) {
      console.warn('⚠️ useGoogleMaps: Found multiple Google Maps scripts, this may cause conflicts');
      return true;
    }
    return false;
  }, []);

  const loadMaps = useCallback(async () => {
    if (!MAPS_CONFIG.GOOGLE_MAPS_API_KEY) {
      setError('Google Maps API key not configured');
      return;
    }

    // Check for conflicts before loading
    if (checkForConflicts()) {
      setError('Multiple Google Maps scripts detected. Please refresh the page.');
      return;
    }

    // Prevent multiple simultaneous loading attempts
    if (loadingRef.current) {
      console.log('🔄 useGoogleMaps: Already loading, skipping duplicate call');
      return;
    }

    try {
      loadingRef.current = true;
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 useGoogleMaps: Starting to load Google Maps');
      await googleMapsManager.loadGoogleMaps(MAPS_CONFIG.GOOGLE_MAPS_API_KEY);
      
      if (isMountedRef.current) {
        setIsLoaded(true);
        setIsLoading(false);
        console.log('✅ useGoogleMaps: Google Maps loaded successfully');
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load Google Maps';
        console.error('❌ useGoogleMaps: Error loading maps:', errorMessage);
        setError(errorMessage);
        setIsLoading(false);
      }
    } finally {
      loadingRef.current = false;
    }
  }, [checkForConflicts]);

  const retry = useCallback(() => {
    console.log('🔄 useGoogleMaps: Retrying Google Maps load');
    setError(null);
    setIsLoaded(false);
    loadMaps();
  }, [loadMaps]);

  useEffect(() => {
    // Check if already loaded
    if (googleMapsManager.isGoogleMapsReady()) {
      console.log('✅ useGoogleMaps: Google Maps already ready');
      setIsLoaded(true);
      return;
    }

    // Check for conflicts before attempting to load
    if (checkForConflicts()) {
      setError('Multiple Google Maps scripts detected. Please refresh the page.');
      return;
    }

    // Load maps if not already loaded
    loadMaps();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadMaps, checkForConflicts]);

  return {
    isLoaded,
    isLoading,
    error,
    retry
  };
};
