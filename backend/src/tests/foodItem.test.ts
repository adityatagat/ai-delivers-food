import request from 'supertest';
import app from '../index';
import FoodItem from '../models/FoodItem';
import { sampleFoodItems } from './data/sampleFoodItems';

describe('Food Items API', () => {
  beforeEach(async () => {
    await FoodItem.deleteMany({});
    await FoodItem.insertMany(sampleFoodItems);
  });

  describe('GET /api/food-items', () => {
    it('should return all food items', async () => {
      const response = await request(app).get('/api/food-items');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(sampleFoodItems.length);
    });
  });

  describe('GET /api/food-items/:id', () => {
    it('should return a specific food item', async () => {
      const foodItem = await FoodItem.findOne({ name: 'Margherita Pizza' });
      if (!foodItem) {
        throw new Error('Test food item not found');
      }
      const response = await request(app).get(`/api/food-items/${foodItem._id}`);
      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Margherita Pizza');
    });

    it('should return 404 for non-existent food item', async () => {
      const response = await request(app).get('/api/food-items/123456789012');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/food-items', () => {
    it('should create a new food item', async () => {
      const newFoodItem = {
        name: "Pepperoni Pizza",
        description: "Pizza with pepperoni and cheese",
        price: 14.99,
        category: "Pizza",
        imageUrl: "https://example.com/pepperoni.jpg",
        isAvailable: true,
        preparationTime: 15
      };

      const response = await request(app)
        .post('/api/food-items')
        .send(newFoodItem);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(newFoodItem.name);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/food-items')
        .send({ name: 'Invalid Item' });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/food-items/:id', () => {
    it('should update a food item', async () => {
      const foodItem = await FoodItem.findOne({ name: 'Margherita Pizza' });
      const update = { price: 13.99 };
      if (!foodItem) {
        throw new Error('Test food item not found');
      }

      const response = await request(app)
        .put(`/api/food-items/${foodItem._id}`)
        .send(update);

      expect(response.status).toBe(200);
      expect(response.body.price).toBe(13.99);
    });
  });

  describe('DELETE /api/food-items/:id', () => {
    it('should delete a food item', async () => {
      const foodItem = await FoodItem.findOne({ name: 'Margherita Pizza' });
      if (!foodItem) {
        throw new Error('Test food item not found');
      }
      const response = await request(app)
        .delete(`/api/food-items/${foodItem._id}`);

      expect(response.status).toBe(200);
      
      const deletedItem = await FoodItem.findById(foodItem._id);
      expect(deletedItem).toBeNull();
    });
  });
});