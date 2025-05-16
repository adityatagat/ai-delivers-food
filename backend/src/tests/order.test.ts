import request from 'supertest';
import app from '../index';
import Order from '../models/Order';
import FoodItem from '../models/FoodItem';
import User from '../models/User';
import { sampleFoodItems } from './data/sampleFoodItems';

describe('Orders API', () => {
  let foodItems: any[];
  let userToken: string;

  beforeEach(async () => {
    foodItems = await FoodItem.insertMany(sampleFoodItems);
    
    // Create test user and get token
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    });
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    userToken = response.body.token;
  });

  describe('POST /api/orders', () => {
    it('should create a new order', async () => {
      const orderData = {
        items: [
          { foodItem: foodItems[0]._id, quantity: 2 },
          { foodItem: foodItems[1]._id, quantity: 1 }
        ],
        deliveryAddress: '123 Test St, Test City'
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData);

      expect(response.status).toBe(201);
      expect(response.body.items).toHaveLength(2);
      expect(response.body.status).toBe('pending');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/orders', () => {
    it('should return all orders', async () => {
      const response = await request(app).get('/api/orders');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('PATCH /api/orders/:id/status', () => {
    it('should update order status', async () => {
      const order = await Order.create({
        user: 'test-user',
        items: [{ foodItem: foodItems[0]._id, quantity: 1, price: 10 }],
        totalAmount: 10,
        deliveryAddress: '123 Test St'
      });

      const response = await request(app)
        .patch(`/api/orders/${order._id}/status`)
        .send({ status: 'preparing' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('preparing');
    });
  });

  describe('Order History and Filtering', () => {
    beforeEach(async () => {
      // Create multiple orders with different statuses and dates
      const orders = [
        {
          user: 'test-user',
          items: [{ foodItem: foodItems[0]._id, quantity: 1, price: 10 }],
          totalAmount: 10,
          deliveryAddress: '123 Test St',
          status: 'pending',
          createdAt: new Date('2024-01-01')
        },
        {
          user: 'test-user',
          items: [{ foodItem: foodItems[1]._id, quantity: 1, price: 15 }],
          totalAmount: 15,
          deliveryAddress: '123 Test St',
          status: 'delivered',
          createdAt: new Date('2024-01-02')
        },
        {
          user: 'admin',
          items: [{ foodItem: foodItems[0]._id, quantity: 2, price: 20 }],
          totalAmount: 20,
          deliveryAddress: '456 Test St',
          status: 'preparing',
          createdAt: new Date('2024-01-03')
        }
      ];

      await Order.insertMany(orders);
    });

    it('should get paginated orders', async () => {
      const response = await request(app)
        .get('/api/orders?page=1&limit=2')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.orders).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.totalPages).toBe(1);
    });

    it('should filter orders by status', async () => {
      const response = await request(app)
        .get('/api/orders?status=pending')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.orders.every((order: any) => order.status === 'pending')).toBe(true);
    });

    it('should filter orders by date range', async () => {
      const response = await request(app)
        .get('/api/orders?startDate=2024-01-01&endDate=2024-01-02')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.orders).toHaveLength(2);
    });

    it('should sort orders by total amount', async () => {
      const response = await request(app)
        .get('/api/orders?sortBy=totalAmount&sortOrder=desc')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      const amounts = response.body.orders.map((order: any) => order.totalAmount);
      expect(amounts).toEqual([...amounts].sort((a, b) => b - a));
    });

    it('should get order statistics', async () => {
      const response = await request(app)
        .get('/api/orders/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.stats).toBeDefined();
      expect(response.body.totalOrders).toBe(2); // Only user's orders
      expect(response.body.totalAmount).toBe(25); // Sum of user's orders
    });
  });
});