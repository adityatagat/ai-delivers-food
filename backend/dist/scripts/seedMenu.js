"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Menu_1 = __importDefault(require("../models/Menu"));
const FoodItem_1 = __importDefault(require("../models/FoodItem"));
dotenv_1.default.config();
const seed = async () => {
    await mongoose_1.default.connect(process.env.MONGO_URI);
    // Remove old data
    await Menu_1.default.deleteMany({});
    await FoodItem_1.default.deleteMany({});
    // Create food items
    const pizza = await FoodItem_1.default.create({
        name: 'Margherita Pizza',
        description: 'Classic cheese pizza',
        price: 12.99,
        category: 'Pizza',
        imageUrl: '/images/margherita-pizza.png',
        isAvailable: true,
        preparationTime: 20
    });
    const sushi = await FoodItem_1.default.create({
        name: 'Salmon Sushi',
        description: 'Fresh salmon sushi',
        price: 9.99,
        category: 'Sushi',
        imageUrl: '/images/salmon-sushi.png',
        isAvailable: true,
        preparationTime: 15
    });
    // Create menu
    await Menu_1.default.create({
        name: 'Main Menu',
        description: 'All available items',
        items: [pizza._id, sushi._id]
    });
    console.log('Seeded menu and food items!');
    process.exit(0);
};
seed();
