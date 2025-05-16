import { Router } from 'express';
import { getRestaurantLocation } from '../controllers/restaurantController';

const router = Router();

/**
 * @route GET /api/restaurant/location
 * @desc Get restaurant location based on environment variable
 * @access Public
 */
router.get('/location', getRestaurantLocation);

export default router; 