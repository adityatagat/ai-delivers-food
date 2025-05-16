"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const OrderSchema = new mongoose_1.Schema({
    user: {
        type: String,
        required: true
    },
    items: [{
            foodItem: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'FoodItem',
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            price: {
                type: Number,
                required: true,
                min: 0
            }
        }],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'preparing', 'ready', 'delivered', 'cancelled'],
        default: 'pending'
    },
    deliveryAddress: {
        type: String,
        required: true
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
exports.default = mongoose_1.default.model('Order', OrderSchema);
