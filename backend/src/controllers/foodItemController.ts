import { Request, Response } from 'express';
import FoodItem, { IFoodItem } from '../models/FoodItem';

export const getAllFoodItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const foodItems = await FoodItem.find();
    res.json(foodItems);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching food items', error });
  }
};

export const getFoodItemById = async (req: Request, res: Response): Promise<void> => {
  try {
    const foodItem = await FoodItem.findById(req.params.id);
    if (!foodItem) {
      res.status(404).json({ message: 'Food item not found' });
      return;
    }
    res.json(foodItem);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching food item', error });
  }
};

export const createFoodItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const newFoodItem = new FoodItem(req.body);
    const savedFoodItem = await newFoodItem.save();
    res.status(201).json(savedFoodItem);
  } catch (error) {
    res.status(400).json({ message: 'Error creating food item', error });
  }
};

export const updateFoodItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const updatedFoodItem = await FoodItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedFoodItem) {
      res.status(404).json({ message: 'Food item not found' });
      return;
    }
    res.json(updatedFoodItem);
  } catch (error) {
    res.status(400).json({ message: 'Error updating food item', error });
  }
};

export const deleteFoodItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedFoodItem = await FoodItem.findByIdAndDelete(req.params.id);
    if (!deletedFoodItem) {
      res.status(404).json({ message: 'Food item not found' });
      return;
    }
    res.json({ message: 'Food item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting food item', error });
  }
};