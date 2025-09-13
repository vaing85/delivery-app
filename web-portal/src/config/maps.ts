// Google Maps Configuration
export const MAPS_CONFIG = {
  // Replace this with your actual Google Maps API key
  // Get it from: https://console.cloud.google.com/apis/credentials
  GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY',
  
  // Default map settings
  DEFAULT_CENTER: { lat: 40.7128, lng: -74.0060 }, // New York City
  DEFAULT_ZOOM: 12,
  
  // Map styles for a cleaner look
  MAP_STYLES: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    },
    {
      featureType: 'transit',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ],
  
  // Marker icons
  MARKER_ICONS: {
    pickup: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
    delivery: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
    driver: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
  }
};

// Environment variable setup instructions
export const MAPS_SETUP_INSTRUCTIONS = `
To enable Google Maps integration:

1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create a new project or select existing one
3. Enable Maps JavaScript API
4. Create credentials (API Key)
5. Add the API key to your .env file:
   VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
6. Restrict the API key to your domain for security

Note: The free tier includes $200 monthly credit, which is usually sufficient for development.
`;
