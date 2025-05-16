"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markOrderAsArrived = exports.getOrderTracking = exports.updateOrderLocation = void 0;
const Order_1 = __importDefault(require("../models/Order"));
const mapsService_1 = __importDefault(require("../services/mapsService"));
const socketService_1 = __importDefault(require("../services/socketService"));
const updateOrderLocation = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { lat, lng, address } = req.body;
        if (!orderId || !lat || !lng) {
            res.status(400).json({ message: 'Missing required fields: orderId, lat, lng' });
            return;
        }
        const order = await Order_1.default.findById(orderId);
        if (!order) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }
        const currentLocation = { lat, lng, address };
        const restaurantLocation = await mapsService_1.default.geocodeAddress(process.env.RESTAURANT_ADDRESS || '');
        const route = await mapsService_1.default.calculateRoute(restaurantLocation, currentLocation);
        const estimatedArrival = await mapsService_1.default.getEstimatedArrivalTime(route);
        const trackingInfo = {
            orderId,
            currentLocation,
            estimatedArrival,
            status: 'in_transit',
            lastUpdated: new Date()
        };
        order.tracking = trackingInfo;
        await order.save();
        try {
            socketService_1.default.emitTrackingUpdate(orderId, trackingInfo);
        }
        catch (socketError) {
            console.error('Failed to emit tracking update:', socketError);
            // Continue with the response even if socket emission fails
        }
        res.json(trackingInfo);
    }
    catch (error) {
        console.error('Error updating order location:', error);
        res.status(500).json({
            message: 'Error updating order location',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.updateOrderLocation = updateOrderLocation;
const getOrderTracking = async (req, res) => {
    try {
        const { orderId } = req.params;
        if (!orderId) {
            res.status(400).json({ message: 'Order ID is required' });
            return;
        }
        const order = await Order_1.default.findById(orderId);
        if (!order) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }
        if (!order.tracking) {
            res.status(404).json({ message: 'No tracking information available' });
            return;
        }
        res.json(order.tracking);
    }
    catch (error) {
        console.error('Error fetching tracking information:', error);
        res.status(500).json({
            message: 'Error fetching tracking information',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getOrderTracking = getOrderTracking;
const markOrderAsArrived = async (req, res) => {
    try {
        const { orderId } = req.params;
        if (!orderId) {
            res.status(400).json({ message: 'Order ID is required' });
            return;
        }
        const order = await Order_1.default.findById(orderId);
        if (!order) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }
        if (!order.tracking) {
            res.status(400).json({ message: 'No tracking information available' });
            return;
        }
        const updatedTracking = {
            ...order.tracking,
            status: 'arrived',
            lastUpdated: new Date()
        };
        order.tracking = updatedTracking;
        order.status = 'delivered';
        await order.save();
        const orderStatus = {
            orderId,
            status: 'delivered',
            lastUpdated: new Date()
        };
        try {
            socketService_1.default.emitTrackingUpdate(orderId, updatedTracking);
            socketService_1.default.emitOrderStatusUpdate(orderId, orderStatus);
        }
        catch (socketError) {
            console.error('Failed to emit updates:', socketError);
            // Continue with the response even if socket emission fails
        }
        res.json(updatedTracking);
    }
    catch (error) {
        console.error('Error marking order as arrived:', error);
        res.status(500).json({
            message: 'Error marking order as arrived',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.markOrderAsArrived = markOrderAsArrived;
