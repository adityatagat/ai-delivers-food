import axios from 'axios';
import { ILocation, IDeliveryRoute } from '../interfaces/tracking';

interface GeocodingResponse {
  results: Array<{
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    formatted_address: string;
  }>;
}

interface DirectionsResponse {
  routes: Array<{
    legs: Array<{
      duration: {
        value: number;
      };
      distance: {
        value: number;
      };
    }>;
  }>;
}

class MapsService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyAO_KNmgR67DqAeV0XnYhKSU2CHXu7YsbQ';
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
    if (!this.apiKey) {
      throw new Error('Google Maps API key is required');
    }
  }

  async geocodeAddress(address: string): Promise<ILocation> {
    try {
      const response = await axios.get<GeocodingResponse>(`${this.baseUrl}/geocode/json`, {
        params: {
          address,
          key: this.apiKey
        }
      });

      const result = response.data.results[0];
      if (!result) {
        throw new Error('No results found for the given address');
      }

      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        address: result.formatted_address
      };
    } catch (error) {
      throw new Error(`Geocoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async calculateRoute(origin: ILocation, destination: ILocation, waypoints?: ILocation[]): Promise<IDeliveryRoute> {
    try {
      const response = await axios.get<DirectionsResponse>(`${this.baseUrl}/directions/json`, {
        params: {
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
          waypoints: waypoints?.map(wp => `${wp.lat},${wp.lng}`).join('|'),
          key: this.apiKey
        }
      });

      const route = response.data.routes[0].legs[0];
      if (!route) {
        throw new Error('No route found between the given locations');
      }

      return {
        origin,
        destination,
        waypoints,
        distance: route.distance.value,
        duration: route.duration.value
      };
    } catch (error) {
      throw new Error(`Route calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getEstimatedArrivalTime(route: IDeliveryRoute): Promise<Date> {
    const now = new Date();
    return new Date(now.getTime() + route.duration * 1000);
  }
}

export default new MapsService(); 