import { Request, Response } from 'express';
import mapsService from '../services/mapsService';

export const getRestaurantLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurantAddress = process.env.RESTAURANT_ADDRESS;
    
    if (!restaurantAddress) {
      res.status(500).json({ message: 'Restaurant address not configured' });
      return;
    }

    try {
      const location = await mapsService.geocodeAddress(restaurantAddress);
      res.json(location);
    } catch (geocodeError) {
      console.error('Error geocoding restaurant address:', geocodeError);
      res.status(500).json({ 
        message: 'Failed to geocode restaurant address',
        error: geocodeError instanceof Error ? geocodeError.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error getting restaurant location:', error);
    res.status(500).json({ 
      message: 'Error getting restaurant location',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 