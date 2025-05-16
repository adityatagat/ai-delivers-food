import { Request, Response } from 'express';
import Order from '../models/Order';
import mapsService from '../services/mapsService';
import socketService from '../services/socketService';
import { ILocation, ITrackingInfo, IOrderStatus } from '../interfaces/tracking';

export const updateOrderLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { lat, lng, address } = req.body;

    if (!orderId || !lat || !lng) {
      res.status(400).json({ message: 'Missing required fields: orderId, lat, lng' });
      return;
    }

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    const currentLocation: ILocation = { lat, lng, address };
    const restaurantLocation = await mapsService.geocodeAddress(process.env.RESTAURANT_ADDRESS || '');
    const route = await mapsService.calculateRoute(restaurantLocation, currentLocation);
    const estimatedArrival = await mapsService.getEstimatedArrivalTime(route);

    const trackingInfo: ITrackingInfo = {
      orderId,
      currentLocation,
      estimatedArrival,
      status: 'in_transit',
      lastUpdated: new Date()
    };

    order.tracking = trackingInfo;
    await order.save();

    try {
      socketService.emitTrackingUpdate(orderId, trackingInfo);
    } catch (socketError) {
      console.error('Failed to emit tracking update:', socketError);
      // Continue with the response even if socket emission fails
    }

    res.json(trackingInfo);
  } catch (error) {
    console.error('Error updating order location:', error);
    res.status(500).json({ 
      message: 'Error updating order location',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getOrderTracking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      res.status(400).json({ message: 'Order ID is required' });
      return;
    }

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    if (!order.tracking) {
      res.status(404).json({ message: 'No tracking information available' });
      return;
    }

    res.json(order.tracking);
  } catch (error) {
    console.error('Error fetching tracking information:', error);
    res.status(500).json({ 
      message: 'Error fetching tracking information',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const markOrderAsArrived = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      res.status(400).json({ message: 'Order ID is required' });
      return;
    }

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    if (!order.tracking) {
      res.status(400).json({ message: 'No tracking information available' });
      return;
    }

    const updatedTracking: ITrackingInfo = {
      ...order.tracking,
      status: 'arrived',
      lastUpdated: new Date()
    };

    order.tracking = updatedTracking;
    order.status = 'delivered';
    await order.save();

    const orderStatus: IOrderStatus = {
      orderId,
      status: 'delivered',
      lastUpdated: new Date()
    };

    try {
      socketService.emitTrackingUpdate(orderId, updatedTracking);
      socketService.emitOrderStatusUpdate(orderId, orderStatus);
    } catch (socketError) {
      console.error('Failed to emit updates:', socketError);
      // Continue with the response even if socket emission fails
    }

    res.json(updatedTracking);
  } catch (error) {
    console.error('Error marking order as arrived:', error);
    res.status(500).json({ 
      message: 'Error marking order as arrived',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 