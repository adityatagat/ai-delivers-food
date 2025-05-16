"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const trackingController_1 = require("../controllers/trackingController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.auth);
/**
 * @swagger
 * /api/tracking/{orderId}:
 *   get:
 *     summary: Get order tracking information
 *     tags: [Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order tracking information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currentLocation:
 *                   type: object
 *                   properties:
 *                     lat:
 *                       type: number
 *                     lng:
 *                       type: number
 *                     address:
 *                       type: string
 *                 estimatedArrival:
 *                   type: string
 *                   format: date-time
 *                 status:
 *                   type: string
 *                   enum: [picked_up, in_transit, arrived]
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Order or tracking information not found
 *       500:
 *         description: Server error
 *
 *   patch:
 *     summary: Update order location
 *     tags: [Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lat
 *               - lng
 *               - address
 *             properties:
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Location updated successfully
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 *
 * /api/tracking/{orderId}/arrived:
 *   post:
 *     summary: Mark order as arrived
 *     tags: [Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order marked as arrived
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.get('/:orderId', trackingController_1.getOrderTracking);
router.patch('/:orderId', auth_1.adminAuth, trackingController_1.updateOrderLocation);
router.post('/:orderId/arrived', auth_1.adminAuth, trackingController_1.markOrderAsArrived);
exports.default = router;
