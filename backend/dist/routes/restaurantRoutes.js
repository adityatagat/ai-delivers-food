"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const restaurantController_1 = require("../controllers/restaurantController");
const router = (0, express_1.Router)();
/**
 * @route GET /api/restaurant/location
 * @desc Get restaurant location based on environment variable
 * @access Public
 */
router.get('/location', restaurantController_1.getRestaurantLocation);
exports.default = router;
