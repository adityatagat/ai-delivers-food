import { Request, Response } from 'express';
import Order, { IOrder } from '../models/Order';
import FoodItem from '../models/FoodItem';
import { OrderQuery } from '../interfaces/orderQuery';

interface AuthRequest extends Request {
  user?: any;
}

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { items, deliveryAddress } = req.body;
    
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const foodItem = await FoodItem.findById(item.foodItem);
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

    const order = new Order({
      user: 'temp-user',
      items: orderItems,
      totalAmount,
      deliveryAddress
    });

    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(400).json({ message: 'Error creating order', error });
  }
};

export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    // Get query parameters
    const {
      status,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query as OrderQuery;

    // Build query
    const query: any = isAdmin ? {} : { user: userId };
    
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
      Order.find(query)
        .populate('items.foodItem')
        .populate('user', 'name email')
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(query)
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
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error });
  }
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.foodItem');
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order', error });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('items.foodItem');

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: 'Error updating order status', error });
  }
};

export const getOrderStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    const query = isAdmin ? {} : { user: userId };

    const stats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalOrders = await Order.countDocuments(query);
    const totalAmount = await Order.aggregate([
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
      totalAmount: totalAmount[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order stats', error });
  }
};