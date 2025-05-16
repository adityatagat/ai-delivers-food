"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
class MapsService {
    constructor() {
        this.apiKey = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyAO_KNmgR67DqAeV0XnYhKSU2CHXu7YsbQ';
        this.baseUrl = 'https://maps.googleapis.com/maps/api';
        if (!this.apiKey) {
            throw new Error('Google Maps API key is required');
        }
    }
    async geocodeAddress(address) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/geocode/json`, {
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
        }
        catch (error) {
            throw new Error(`Geocoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async calculateRoute(origin, destination, waypoints) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/directions/json`, {
                params: {
                    origin: `${origin.lat},${origin.lng}`,
                    destination: `${destination.lat},${destination.lng}`,
                    waypoints: waypoints === null || waypoints === void 0 ? void 0 : waypoints.map(wp => `${wp.lat},${wp.lng}`).join('|'),
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
        }
        catch (error) {
            throw new Error(`Route calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getEstimatedArrivalTime(route) {
        const now = new Date();
        return new Date(now.getTime() + route.duration * 1000);
    }
}
exports.default = new MapsService();
