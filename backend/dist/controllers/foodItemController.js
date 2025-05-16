"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFoodItem = exports.updateFoodItem = exports.createFoodItem = exports.getFoodItemById = exports.getAllFoodItems = void 0;
const FoodItem_1 = __importDefault(require("../models/FoodItem"));
const getAllFoodItems = async (req, res) => {
    try {
        const foodItems = await FoodItem_1.default.find();
        res.json(foodItems);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching food items', error });
    }
};
exports.getAllFoodItems = getAllFoodItems;
const getFoodItemById = async (req, res) => {
    try {
        const foodItem = await FoodItem_1.default.findById(req.params.id);
        if (!foodItem) {
            res.status(404).json({ message: 'Food item not found' });
            return;
        }
        res.json(foodItem);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching food item', error });
    }
};
exports.getFoodItemById = getFoodItemById;
const createFoodItem = async (req, res) => {
    try {
        const newFoodItem = new FoodItem_1.default(req.body);
        const savedFoodItem = await newFoodItem.save();
        res.status(201).json(savedFoodItem);
    }
    catch (error) {
        res.status(400).json({ message: 'Error creating food item', error });
    }
};
exports.createFoodItem = createFoodItem;
const updateFoodItem = async (req, res) => {
    try {
        const updatedFoodItem = await FoodItem_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedFoodItem) {
            res.status(404).json({ message: 'Food item not found' });
            return;
        }
        res.json(updatedFoodItem);
    }
    catch (error) {
        res.status(400).json({ message: 'Error updating food item', error });
    }
};
exports.updateFoodItem = updateFoodItem;
const deleteFoodItem = async (req, res) => {
    try {
        const deletedFoodItem = await FoodItem_1.default.findByIdAndDelete(req.params.id);
        if (!deletedFoodItem) {
            res.status(404).json({ message: 'Food item not found' });
            return;
        }
        res.json({ message: 'Food item deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting food item', error });
    }
};
exports.deleteFoodItem = deleteFoodItem;
