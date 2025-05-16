"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderStats = exports.updateOrderStatus = exports.getOrderById = exports.getOrders = exports.createOrder = void 0;
const Order_1 = __importDefault(require("../models/Order"));
const FoodItem_1 = __importDefault(require("../models/FoodItem"));
const createOrder = async (req, res) => {
    try {
        const { items, deliveryAddress } = req.body;
        let totalAmount = 0;
        const orderItems = [];
        for (const item of items) {
            const foodItem = await FoodItem_1.default.findById(item.foodItem);
            if (!foodItem) {
                res.status(400).json({ message: `Food item ${item.foodItem} not found` });
                return;
            }
            if (!foodItem.isAvailable) {
                res.status(400).json({ message: `Food item ${foodItem.name} is not available` });
                return;
            }
            totalAmount += foodItem.price * item.quantity;
            orderItems.push({
                foodItem: foodItem._id,
                quantity: item.quantity,
                price: foodItem.price
            });
        }
        const order = new Order_1.default({
            user: 'temp-user',
            items: orderItems,
            totalAmount,
            deliveryAddress
        });
        const savedOrder = await order.save();
        res.status(201).json(savedOrder);
    }
    catch (error) {
        res.status(400).json({ message: 'Error creating order', error });
    }
};
exports.createOrder = createOrder;
const getOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        const isAdmin = req.user.role === 'admin';
        // Get query parameters
        const { status, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = req.query;
        // Build query
        const query = isAdmin ? {} : { user: userId };
        if (status) {
            query.status = status;
        }
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        }
        // Calculate pagination
        const skip = (Number(page) - 1) * Number(limit);
        // Execute query with pagination and sorting
        const [orders, total] = await Promise.all([
            Order_1.default.find(query)
                .populate('items.foodItem')
                .populate('user', 'name email')
                .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
                .skip(skip)
                .limit(Number(limit)),
            Order_1.default.countDocuments(query)
        ]);
        // Calculate pagination metadata
        const totalPages = Math.ceil(total / Number(limit));
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        res.json({
            orders,
            pagination: {
                total,
                totalPages,
                currentPage: Number(page),
                limit: Number(limit),
                hasNextPage,
                hasPrevPage
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error });
    }
};
exports.getOrders = getOrders;
const getOrderById = async (req, res) => {
    try {
        const order = await Order_1.default.findById(req.params.id)
            .populate('items.foodItem');
        if (!order) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }
        res.json(order);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching order', error });
    }
};
exports.getOrderById = getOrderById;
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order_1.default.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true }).populate('items.foodItem');
        if (!order) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }
        res.json(order);
    }
    catch (error) {
        res.status(400).json({ message: 'Error updating order status', error });
    }
};
exports.updateOrderStatus = updateOrderStatus;
const getOrderStats = async (req, res) => {
    var _a;
    try {
        const userId = req.user._id;
        const isAdmin = req.user.role === 'admin';
        const query = isAdmin ? {} : { user: userId };
        const stats = await Order_1.default.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' }
                }
            }
        ]);
        const totalOrders = await Order_1.default.countDocuments(query);
        const totalAmount = await Order_1.default.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalAmount' }
                }
            }
        ]);
        res.json({
            stats,
            totalOrders,
            totalAmount: ((_a = totalAmount[0]) === null || _a === void 0 ? void 0 : _a.total) || 0
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching order stats', error });
    }
};
exports.getOrderStats = getOrderStats;
