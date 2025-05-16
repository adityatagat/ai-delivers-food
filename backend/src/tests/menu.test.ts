import request from 'supertest';
import app from '../index'; // or wherever your Express app is exported
import mongoose from 'mongoose';
import Menu from '../models/Menu';
import FoodItem from '../models/FoodItem';

describe('GET /api/menu', () => {
  beforeAll(async () => {
    // Connect to test DB and seed
    await mongoose.connect(process.env.MONGO_URI as string);
    await Menu.deleteMany({});
    await FoodItem.deleteMany({});
    const item = await FoodItem.create({
      name: 'Test Item',
      description: 'Test Desc',
      price: 5,
      category: 'Pizza',
      imageUrl: '/images/test.png',
      isAvailable: true,
      preparationTime: 10
    });
    await Menu.create({
      name: 'Test Menu',
      items: [item._id]
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should return menus with items', async () => {
    const res = await request(app).get('/api/menu');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('items');
    expect(res.body[0].items.length).toBeGreaterThan(0);
    expect(res.body[0].items[0]).toHaveProperty('name', 'Test Item');
  });
});
