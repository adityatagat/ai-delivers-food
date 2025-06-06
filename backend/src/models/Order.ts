import mongoose, { Schema, Document } from 'mongoose';
import { IFoodItem } from './FoodItem';
import { ILocation, ITrackingInfo } from '../interfaces/tracking';

interface OrderItem {
  menuItem: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  restaurant: mongoose.Types.ObjectId;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'preparing' | 'out_for_delivery' | 'delivered' | 'completed' | 'cancelled';
  deliveryAddress: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  tracking?: ITrackingInfo;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  items: [{
    menuItem: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'preparing', 'out_for_delivery', 'delivered', 'completed', 'cancelled'],
    default: 'pending'
  },
  deliveryAddress: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  tracking: {
    orderId: { type: String },
    currentLocation: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String }
    },
    estimatedArrival: { type: Date },
    status: {
      type: String,
      enum: ['picked_up', 'in_transit', 'arrived'],
      default: 'picked_up'
    },
    lastUpdated: { type: Date, default: Date.now }
  }
}, {
  timestamps: true
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       required:
 *         - user
 *         - items
 *         - totalAmount
 *         - deliveryAddress
 *       properties:
 *         user:
 *           type: string
 *           description: ID of the user who placed the order
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               foodItem:
 *                 type: string
 *                 description: ID of the food item
 *               quantity:
 *                 type: number
 *                 description: Quantity of the food item
 *               price:
 *                 type: number
 *                 description: Price of the food item
 *         totalAmount:
 *           type: number
 *           description: Total amount of the order
 *         status:
 *           type: string
 *           enum: [pending, preparing, ready, delivered, cancelled]
 *           default: pending
 *           description: Status of the order
 *         deliveryAddress:
 *           type: string
 *           description: Delivery address
 *         tracking:
 *           type: object
 *           properties:
 *             orderId:
 *               type: string
 *               description: ID of the order
 *             currentLocation:
 *               type: object
 *               properties:
 *                 lat:
 *                   type: number
 *                   description: Latitude of current location
 *                 lng:
 *                   type: number
 *                   description: Longitude of current location
 *                 address:
 *                   type: string
 *                   description: Formatted address
 *             estimatedArrival:
 *               type: string
 *               format: date-time
 *               description: Estimated time of arrival
 *             status:
 *               type: string
 *               enum: [picked_up, in_transit, arrived]
 *               description: Current tracking status
 *             lastUpdated:
 *               type: string
 *               format: date-time
 *               description: Last tracking update timestamp
 */

export default mongoose.model<IOrder>('Order', OrderSchema);