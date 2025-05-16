import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Menu from '../models/Menu';
import FoodItem from '../models/FoodItem';

dotenv.config();

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI as string);

  // Remove old data
  await Menu.deleteMany({});
  await FoodItem.deleteMany({});

  // Create food items
  const pizza = await FoodItem.create({
    name: 'Margherita Pizza',
    description: 'Classic cheese pizza',
    price: 12.99,
    category: 'Pizza',
    imageUrl: '/images/margherita-pizza.png',
    isAvailable: true,
    preparationTime: 20
  });

  const sushi = await FoodItem.create({
    name: 'Salmon Sushi',
    description: 'Fresh salmon sushi',
    price: 9.99,
    category: 'Sushi',
    imageUrl: '/images/salmon-sushi.png',
    isAvailable: true,
    preparationTime: 15
  });

  // Create menu
  await Menu.create({
    name: 'Main Menu',
    description: 'All available items',
    items: [pizza._id, sushi._id]
  });

  console.log('Seeded menu and food items!');
  process.exit(0);
};

seed();
