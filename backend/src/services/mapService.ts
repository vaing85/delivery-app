import axios from 'axios';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface RoutePoint {
  location: Location;
  orderId?: string;
  estimatedDuration?: number;
  estimatedDistance?: number;
}

export interface OptimizedRoute {
  points: RoutePoint[];
  totalDistance: number; // in kilometers
  totalDuration: number; // in minutes
  polyline?: string;
  isOptimized: boolean;
  optimizationTimestamp: string;
}

export class MapService {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_MAPS_API_KEY || '';
  }

  // Geocode an address to coordinates
  async geocodeAddress(address: string): Promise<Location> {
    try {
      if (!this.apiKey) {
        // Mock response for development
        return this.getMockLocation(address);
      }

      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          address,
          key: this.apiKey
        }
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        const location = result.geometry.location;
        
        return {
          latitude: location.lat,
          longitude: location.lng,
          address: result.formatted_address
        };
      } else {
        throw new Error(`Geocoding failed: ${response.data.status}`);
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      // Return mock location as fallback
      return this.getMockLocation(address);
    }
  }

  // Reverse geocode coordinates to address
  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      if (!this.apiKey) {
        return `Mock Address at ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }

      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          latlng: `${latitude},${longitude}`,
          key: this.apiKey
        }
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        return response.data.results[0].formatted_address;
      } else {
        throw new Error(`Reverse geocoding failed: ${response.data.status}`);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return `Address at ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  }

  // Calculate distance between two points
  async calculateDistance(origin: Location, destination: Location): Promise<{
    distance: number; // in kilometers
    duration: number; // in minutes
  }> {
    try {
      if (!this.apiKey) {
        // Mock calculation for development
        return this.calculateMockDistance(origin, destination);
      }

      const response = await axios.get(`${this.baseUrl}/distancematrix/json`, {
        params: {
          origins: `${origin.latitude},${origin.longitude}`,
          destinations: `${destination.latitude},${destination.longitude}`,
          units: 'metric',
          key: this.apiKey
        }
      });

      if (response.data.status === 'OK' && response.data.rows[0].elements[0].status === 'OK') {
        const element = response.data.rows[0].elements[0];
        return {
          distance: element.distance.value / 1000, // Convert meters to kilometers
          duration: element.duration.value / 60 // Convert seconds to minutes
        };
      } else {
        throw new Error('Distance calculation failed');
      }
    } catch (error) {
      console.error('Error calculating distance:', error);
      return this.calculateMockDistance(origin, destination);
    }
  }

  // Optimize delivery route
  async optimizeRoute(points: RoutePoint[]): Promise<OptimizedRoute> {
    try {
      if (!this.apiKey || points.length < 2) {
        // Mock optimization for development
        return this.getMockOptimizedRoute(points);
      }

      // For Google Maps, we would use the Directions API with waypoint optimization
      // This is a simplified implementation
      const origin = points[0];
      const destination = points[points.length - 1];
      const waypoints = points.slice(1, -1);

      const waypointString = waypoints
        .map(point => `${point.location.latitude},${point.location.longitude}`)
        .join('|');

      const response = await axios.get(`${this.baseUrl}/directions/json`, {
        params: {
          origin: `${origin.location.latitude},${origin.location.longitude}`,
          destination: `${destination.location.latitude},${destination.location.longitude}`,
          waypoints: waypointString,
          optimize: true,
          key: this.apiKey
        }
      });

      if (response.data.status === 'OK' && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const leg = route.legs[0];
        
        return {
          points: points.map((point, index) => ({
            ...point,
            estimatedDuration: leg.duration.value / 60, // Convert to minutes
            estimatedDistance: leg.distance.value / 1000 // Convert to kilometers
          })),
          totalDistance: route.legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0) / 1000,
          totalDuration: route.legs.reduce((sum: number, leg: any) => sum + leg.duration.value, 0) / 60,
          polyline: route.overview_polyline.points,
          isOptimized: true,
          optimizationTimestamp: new Date().toISOString()
        };
      } else {
        throw new Error('Route optimization failed');
      }
    } catch (error) {
      console.error('Error optimizing route:', error);
      return this.getMockOptimizedRoute(points);
    }
  }

  // Get directions between two points
  async getDirections(origin: Location, destination: Location): Promise<{
    distance: number;
    duration: number;
    polyline: string;
    steps: any[];
  }> {
    try {
      if (!this.apiKey) {
        return this.getMockDirections(origin, destination);
      }

      const response = await axios.get(`${this.baseUrl}/directions/json`, {
        params: {
          origin: `${origin.latitude},${origin.longitude}`,
          destination: `${destination.latitude},${destination.longitude}`,
          key: this.apiKey
        }
      });

      if (response.data.status === 'OK' && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const leg = route.legs[0];
        
        return {
          distance: leg.distance.value / 1000,
          duration: leg.duration.value / 60,
          polyline: route.overview_polyline.points,
          steps: leg.steps
        };
      } else {
        throw new Error('Directions request failed');
      }
    } catch (error) {
      console.error('Error getting directions:', error);
      return this.getMockDirections(origin, destination);
    }
  }

  // Find nearby places
  async findNearbyPlaces(location: Location, radius: number = 1000, type?: string): Promise<Location[]> {
    try {
      if (!this.apiKey) {
        return this.getMockNearbyPlaces(location, radius);
      }

      const response = await axios.get(`${this.baseUrl}/place/nearbysearch/json`, {
        params: {
          location: `${location.latitude},${location.longitude}`,
          radius,
          type: type || 'establishment',
          key: this.apiKey
        }
      });

      if (response.data.status === 'OK') {
        return response.data.results.map((place: any) => ({
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          address: place.vicinity
        }));
      } else {
        throw new Error('Nearby places request failed');
      }
    } catch (error) {
      console.error('Error finding nearby places:', error);
      return this.getMockNearbyPlaces(location, radius);
    }
  }

  // Mock methods for development
  private getMockLocation(address: string): Location {
    // Generate mock coordinates based on address hash
    const hash = this.simpleHash(address);
    const lat = 40.7128 + (hash % 1000 - 500) / 10000; // NYC area with some variation
    const lng = -74.0060 + (hash % 1000 - 500) / 10000;
    
    return {
      latitude: lat,
      longitude: lng,
      address
    };
  }

  private calculateMockDistance(origin: Location, destination: Location): { distance: number; duration: number } {
    // Simple Euclidean distance calculation (not accurate for real-world distances)
    const latDiff = destination.latitude - origin.latitude;
    const lngDiff = destination.longitude - origin.longitude;
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111; // Rough conversion to km
    
    return {
      distance: Math.round(distance * 100) / 100,
      duration: Math.round(distance * 2) // Rough estimate: 2 minutes per km
    };
  }

  private getMockOptimizedRoute(points: RoutePoint[]): OptimizedRoute {
    let totalDistance = 0;
    let totalDuration = 0;

    const optimizedPoints = points.map((point, index) => {
      const distance = index === 0 ? 0 : Math.random() * 5 + 1; // 1-6 km
      const duration = index === 0 ? 0 : Math.random() * 20 + 10; // 10-30 min
      
      totalDistance += distance;
      totalDuration += duration;

      return {
        ...point,
        estimatedDistance: Math.round(distance * 100) / 100,
        estimatedDuration: Math.round(duration)
      };
    });

    return {
      points: optimizedPoints,
      totalDistance: Math.round(totalDistance * 100) / 100,
      totalDuration: Math.round(totalDuration),
      isOptimized: true,
      optimizationTimestamp: new Date().toISOString()
    };
  }

  private getMockDirections(origin: Location, destination: Location): {
    distance: number;
    duration: number;
    polyline: string;
    steps: any[];
  } {
    const { distance, duration } = this.calculateMockDistance(origin, destination);
    
    return {
      distance,
      duration,
      polyline: 'mock_polyline_data',
      steps: [
        {
          html_instructions: 'Start at origin',
          distance: { value: 0, text: '0 m' },
          duration: { value: 0, text: '0 min' }
        },
        {
          html_instructions: 'Arrive at destination',
          distance: { value: distance * 1000, text: `${distance} km` },
          duration: { value: duration * 60, text: `${duration} min` }
        }
      ]
    };
  }

  private getMockNearbyPlaces(location: Location, radius: number): Location[] {
    const places: Location[] = [];
    const numPlaces = Math.floor(Math.random() * 5) + 3; // 3-7 places
    
    for (let i = 0; i < numPlaces; i++) {
      const latOffset = (Math.random() - 0.5) * (radius / 111000); // Rough conversion
      const lngOffset = (Math.random() - 0.5) * (radius / 111000);
      
      places.push({
        latitude: location.latitude + latOffset,
        longitude: location.longitude + lngOffset,
        address: `Mock Place ${i + 1}`
      });
    }
    
    return places;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

// Export singleton instance
let mapService: MapService;

export const getMapService = (apiKey?: string) => {
  if (!mapService) {
    mapService = new MapService(apiKey);
  }
  return mapService;
};
