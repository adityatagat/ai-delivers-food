"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../index")); // or wherever your Express app is exported
const mongoose_1 = __importDefault(require("mongoose"));
const Menu_1 = __importDefault(require("../models/Menu"));
const FoodItem_1 = __importDefault(require("../models/FoodItem"));
describe('GET /api/menu', () => {
    beforeAll(async () => {
        // Connect to test DB and seed
        await mongoose_1.default.connect(process.env.MONGO_URI);
        await Menu_1.default.deleteMany({});
        await FoodItem_1.default.deleteMany({});
        const item = await FoodItem_1.default.create({
            name: 'Test Item',
            description: 'Test Desc',
            price: 5,
            category: 'Pizza',
            imageUrl: '/images/test.png',
            isAvailable: true,
            preparationTime: 10
        });
        await Menu_1.default.create({
            name: 'Test Menu',
            items: [item._id]
        });
    });
    afterAll(async () => {
        await mongoose_1.default.connection.close();
    });
    it('should return menus with items', async () => {
        const res = await (0, supertest_1.default)(index_1.default).get('/api/menu');
        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0]).toHaveProperty('items');
        expect(res.body[0].items.length).toBeGreaterThan(0);
        expect(res.body[0].items[0]).toHaveProperty('name', 'Test Item');
    });
});
