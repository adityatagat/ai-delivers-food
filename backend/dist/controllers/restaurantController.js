"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRestaurantLocation = void 0;
const mapsService_1 = __importDefault(require("../services/mapsService"));
const getRestaurantLocation = async (req, res) => {
    try {
        const restaurantAddress = process.env.RESTAURANT_ADDRESS;
        if (!restaurantAddress) {
            res.status(500).json({ message: 'Restaurant address not configured' });
            return;
        }
        try {
            const location = await mapsService_1.default.geocodeAddress(restaurantAddress);
            res.json(location);
        }
        catch (geocodeError) {
            console.error('Error geocoding restaurant address:', geocodeError);
            res.status(500).json({
                message: 'Failed to geocode restaurant address',
                error: geocodeError instanceof Error ? geocodeError.message : 'Unknown error'
            });
        }
    }
    catch (error) {
        console.error('Error getting restaurant location:', error);
        res.status(500).json({
            message: 'Error getting restaurant location',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getRestaurantLocation = getRestaurantLocation;
