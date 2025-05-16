"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../index"));
const FoodItem_1 = __importDefault(require("../models/FoodItem"));
const sampleFoodItems_1 = require("./data/sampleFoodItems");
describe('Food Items API', () => {
    beforeEach(async () => {
        await FoodItem_1.default.deleteMany({});
        await FoodItem_1.default.insertMany(sampleFoodItems_1.sampleFoodItems);
    });
    describe('GET /api/food-items', () => {
        it('should return all food items', async () => {
            const response = await (0, supertest_1.default)(index_1.default).get('/api/food-items');
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(sampleFoodItems_1.sampleFoodItems.length);
        });
    });
    describe('GET /api/food-items/:id', () => {
        it('should return a specific food item', async () => {
            const foodItem = await FoodItem_1.default.findOne({ name: 'Margherita Pizza' });
            if (!foodItem) {
                throw new Error('Test food item not found');
            }
            const response = await (0, supertest_1.default)(index_1.default).get(`/api/food-items/${foodItem._id}`);
            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Margherita Pizza');
        });
        it('should return 404 for non-existent food item', async () => {
            const response = await (0, supertest_1.default)(index_1.default).get('/api/food-items/123456789012');
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
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/food-items')
                .send(newFoodItem);
            expect(response.status).toBe(201);
            expect(response.body.name).toBe(newFoodItem.name);
        });
        it('should validate required fields', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/food-items')
                .send({ name: 'Invalid Item' });
            expect(response.status).toBe(400);
        });
    });
    describe('PUT /api/food-items/:id', () => {
        it('should update a food item', async () => {
            const foodItem = await FoodItem_1.default.findOne({ name: 'Margherita Pizza' });
            const update = { price: 13.99 };
            if (!foodItem) {
                throw new Error('Test food item not found');
            }
            const response = await (0, supertest_1.default)(index_1.default)
                .put(`/api/food-items/${foodItem._id}`)
                .send(update);
            expect(response.status).toBe(200);
            expect(response.body.price).toBe(13.99);
        });
    });
    describe('DELETE /api/food-items/:id', () => {
        it('should delete a food item', async () => {
            const foodItem = await FoodItem_1.default.findOne({ name: 'Margherita Pizza' });
            if (!foodItem) {
                throw new Error('Test food item not found');
            }
            const response = await (0, supertest_1.default)(index_1.default)
                .delete(`/api/food-items/${foodItem._id}`);
            expect(response.status).toBe(200);
            const deletedItem = await FoodItem_1.default.findById(foodItem._id);
            expect(deletedItem).toBeNull();
        });
    });
});
