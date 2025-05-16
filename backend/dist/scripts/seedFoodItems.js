"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const FoodItem_1 = __importDefault(require("../models/FoodItem"));
const sampleFoodItems_1 = require("../tests/data/sampleFoodItems");
dotenv_1.default.config();
const seedDatabase = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGO_URI);
        await FoodItem_1.default.deleteMany({});
        await FoodItem_1.default.insertMany(sampleFoodItems_1.sampleFoodItems);
        console.log('Database seeded successfully');
        process.exit(0);
    }
    catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};
seedDatabase();
