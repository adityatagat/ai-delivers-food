import mongoose, { Schema, Document } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     FoodItem:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - price
 *         - category
 *         - imageUrl
 *         - preparationTime
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the food item
 *         description:
 *           type: string
 *           description: Description of the food item
 *         price:
 *           type: number
 *           description: Price of the food item
 *         category:
 *           type: string
 *           enum: [Pizza, Burger, Sushi, Pasta, Salad, Dessert, Drink]
 *           description: Category of the food item
 *         imageUrl:
 *           type: string
 *           description: URL of the food item's image
 *         isAvailable:
 *           type: boolean
 *           default: true
 *           description: Whether the food item is available
 *         preparationTime:
 *           type: number
 *           description: Preparation time in minutes
 */

export interface IFoodItem extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
  preparationTime: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

const FoodItemSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true,
    min: 0 
  },
  category: { 
    type: String, 
    required: true,
    enum: ['Pizza', 'Burger', 'Sushi', 'Pasta', 'Salad', 'Dessert', 'Drink']
  },
  imageUrl: { 
    type: String, 
    required: true 
  },
  isAvailable: { 
    type: Boolean, 
    default: true 
  },
  preparationTime: { 
    type: Number, 
    required: true,
    min: 1 
  }
}, {
  timestamps: true
});

export default mongoose.model<IFoodItem>('FoodItem', FoodItemSchema);