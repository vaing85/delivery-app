// Global script loading state management
interface GlobalMapsState {
  isLoading: boolean;
  isLoaded: boolean;
  loadPromise: Promise<void> | null;
  scriptElement: HTMLScriptElement | null;
  callbackName: string | null;
}

const globalMapsState: GlobalMapsState = {
  isLoading: false,
  isLoaded: false,
  loadPromise: null,
  scriptElement: null,
  callbackName: null
};

// Global guard to prevent multiple Google Maps loading
let globalMapsGuard = {
  isInitialized: false,
  hasMultipleScripts: false,
  lastCheck: 0
};

class GoogleMapsManager {
  private static instance: GoogleMapsManager;

  private constructor() {}

  static getInstance(): GoogleMapsManager {
    if (!GoogleMapsManager.instance) {
      GoogleMapsManager.instance = new GoogleMapsManager();
    }
    return GoogleMapsManager.instance;
  }

  private checkGlobalGuard(): boolean {
    const now = Date.now();
    
    // Check every 5 seconds to avoid excessive DOM queries
    if (now - globalMapsGuard.lastCheck > 5000) {
      const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
      globalMapsGuard.hasMultipleScripts = existingScripts.length > 1;
      globalMapsGuard.lastCheck = now;
      
      if (globalMapsGuard.hasMultipleScripts) {
        console.warn('⚠️ GoogleMapsManager: Global guard detected multiple scripts, preventing loading');
      }
    }
    
    return globalMapsGuard.hasMultipleScripts;
  }

  async loadGoogleMaps(apiKey: string): Promise<void> {
    console.log('🗺️ GoogleMapsManager: loadGoogleMaps called');
    console.log('🗺️ GoogleMapsManager: Current state:', this.getState());
    
    // Check global guard first
    if (this.checkGlobalGuard()) {
      throw new Error('Multiple Google Maps scripts detected. Please refresh the page to resolve conflicts.');
    }
    
    // Check if already fully loaded
    if (globalMapsState.isLoaded && window.google?.maps?.Map) {
      console.log('🗺️ GoogleMapsManager: Maps already loaded, skipping');
      return Promise.resolve();
    }

    // Check if already loading
    if (globalMapsState.isLoading && globalMapsState.loadPromise) {
      console.log('🗺️ GoogleMapsManager: Maps already loading, waiting for existing promise');
      return globalMapsState.loadPromise;
    }

    // Check if script already exists in DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('🗺️ GoogleMapsManager: Script already exists in DOM, waiting for it to load');
      if (window.google?.maps?.Map) {
        globalMapsState.isLoaded = true;
        return Promise.resolve();
      } else {
        // Script exists but not loaded yet, wait for it
        return this.waitForExistingScript();
      }
    }

    // Start new loading process
    console.log('🗺️ GoogleMapsManager: Starting new script loading process');
    globalMapsState.isLoading = true;
    
    try {
      globalMapsState.loadPromise = this.loadScript(apiKey);
      await globalMapsState.loadPromise;
      globalMapsState.isLoaded = true;
      globalMapsGuard.isInitialized = true;
      console.log('✅ GoogleMapsManager: Script loaded successfully');
    } catch (error) {
      console.error('❌ GoogleMapsManager: Failed to load script:', error);
      globalMapsState.isLoading = false;
      globalMapsState.loadPromise = null;
      throw error;
    } finally {
      globalMapsState.isLoading = false;
    }

    return globalMapsState.loadPromise!;
  }

  private async waitForExistingScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const maxAttempts = 100; // 10 seconds max
      let attempts = 0;

      const checkScript = () => {
        attempts++;
        
        if (window.google?.maps?.Map) {
          console.log('✅ GoogleMapsManager: Existing script became ready');
          globalMapsState.isLoaded = true;
          globalMapsGuard.isInitialized = true;
          resolve();
          return;
        }

        if (attempts >= maxAttempts) {
          reject(new Error('Existing Google Maps script failed to initialize after 10 seconds'));
          return;
        }

        setTimeout(checkScript, 100);
      };

      checkScript();
    });
  }

  private loadScript(apiKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Clean up any existing scripts first
      this.cleanupExistingScripts();
      
      // Create unique callback name
      const callbackName = `googleMapsCallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      globalMapsState.callbackName = callbackName;
      
      console.log('🗺️ GoogleMapsManager: Loading script with callback:', callbackName);
      
      // Create global callback function
      (window as any)[callbackName] = () => {
        console.log('📜 GoogleMapsManager: Script loaded via callback');
        
        // Clean up global callback
        delete (window as any)[callbackName];
        globalMapsState.callbackName = null;
        
        // Wait for full initialization
        setTimeout(() => {
          this.waitForGoogleMaps(resolve, reject);
        }, 500);
      };

      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
      script.async = true;
      script.defer = true;

      script.onerror = () => {
        console.error('❌ GoogleMapsManager: Script failed to load');
        if (globalMapsState.callbackName) {
          delete (window as any)[globalMapsState.callbackName];
          globalMapsState.callbackName = null;
        }
        reject(new Error('Failed to load Google Maps script'));
      };

      // Store script element reference
      globalMapsState.scriptElement = script;
      
      // Append to DOM
      document.head.appendChild(script);
    });
  }

  private cleanupExistingScripts(): void {
    // Remove any existing Google Maps scripts
    const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
    if (existingScripts.length > 0) {
      console.log(`🧹 GoogleMapsManager: Cleaning up ${existingScripts.length} existing scripts`);
      existingScripts.forEach(script => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
    }
    
    // Clean up any existing callback functions
    const callbackPattern = /^googleMapsCallback_/;
    Object.keys(window).forEach(key => {
      if (callbackPattern.test(key)) {
        console.log(`🧹 GoogleMapsManager: Cleaning up existing callback: ${key}`);
        delete (window as any)[key];
      }
    });

    // Also clean up any google.maps.__ib__ callbacks that might exist
    if ((window as any).google?.maps?.__ib__) {
      console.log('🧹 GoogleMapsManager: Cleaning up google.maps.__ib__ callback');
      delete (window as any).google.maps.__ib__;
    }

    // Clean up any other Google Maps related global variables
    const googleMapsGlobals = Object.keys(window).filter(key => 
      key.includes('google') || key.includes('maps') || key.includes('callback')
    );
    if (googleMapsGlobals.length > 0) {
      console.log('🧹 GoogleMapsManager: Found potential conflicting globals:', googleMapsGlobals);
    }
  }

  private waitForGoogleMaps(resolve: () => void, reject: (error: Error) => void): void {
    const maxAttempts = 100; // 10 seconds max
    let attempts = 0;

    const checkGoogleMaps = () => {
      attempts++;
      
      if (window.google?.maps?.Map) {
        console.log('✅ GoogleMapsManager: Maps API ready');
        resolve();
        return;
      }

      if (attempts >= maxAttempts) {
        reject(new Error('Google Maps failed to initialize after 10 seconds'));
        return;
      }

      setTimeout(checkGoogleMaps, 100);
    };

    checkGoogleMaps();
  }

  isGoogleMapsReady(): boolean {
    return globalMapsState.isLoaded && !!window.google?.maps?.Map;
  }

  cleanup(): void {
    console.log('🧹 GoogleMapsManager: Cleaning up...');
    
    // Clean up global callback if it exists
    if (globalMapsState.callbackName) {
      delete (window as any)[globalMapsState.callbackName];
      globalMapsState.callbackName = null;
    }
    
    // Reset state
    globalMapsState.isLoading = false;
    globalMapsState.isLoaded = false;
    globalMapsState.loadPromise = null;
    globalMapsState.scriptElement = null;
  }

  // Force reload for debugging
  forceReload(): void {
    console.log('🔄 GoogleMapsManager: Force reloading...');
    this.cleanup();
    globalMapsGuard.isInitialized = false;
  }

  // Get current state for debugging
  getState(): GlobalMapsState {
    return { ...globalMapsState };
  }

  // Get global guard state for debugging
  getGlobalGuardState() {
    return { ...globalMapsGuard };
  }

  // Debug method to check for existing scripts
  debugExistingScripts(): void {
    const scripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
    console.log('🔍 GoogleMapsManager: Found existing scripts:', scripts.length);
    scripts.forEach((script, index) => {
      console.log(`🔍 Script ${index}:`, script.src);
    });
    
    const callbacks = Object.keys(window).filter(key => /^googleMapsCallback_/.test(key));
    console.log('🔍 GoogleMapsManager: Found existing callbacks:', callbacks);
    
    // Check for other Google Maps related globals
    const googleMapsGlobals = Object.keys(window).filter(key => 
      key.includes('google') || key.includes('maps') || key.includes('callback')
    );
    console.log('🔍 GoogleMapsManager: Found Google Maps related globals:', googleMapsGlobals);
    
    // Check for google.maps.__ib__ specifically
    if ((window as any).google?.maps?.__ib__) {
      console.log('🔍 GoogleMapsManager: Found google.maps.__ib__ callback');
    }

    // Show global guard state
    console.log('🔍 GoogleMapsManager: Global guard state:', this.getGlobalGuardState());
  }
}

export default GoogleMapsManager.getInstance();
