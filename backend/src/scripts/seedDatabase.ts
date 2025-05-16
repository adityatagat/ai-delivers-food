import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import UserModel from '../models/User';
import RestaurantModel from '../models/Restaurant';
import MenuItemModel from '../models/MenuItem';
import OrderModel from '../models/Order';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      UserModel.deleteMany({}),
      RestaurantModel.deleteMany({}),
      MenuItemModel.deleteMany({}),
      OrderModel.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await UserModel.create({
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
      name: 'Admin User'
    });
    console.log('Created admin user');

    // Create restaurant
    const restaurant = await RestaurantModel.create({
      name: 'AI Delivers Restaurant',
      address: process.env.RESTAURANT_ADDRESS || 'UB City, Vittal Mallya Road, KG Halli, Shanthala Nagar, Ashok Nagar, Bangalore, Karnataka 560001',
      cuisine: 'International',
      rating: 4.5,
      deliveryTime: '30-45',
      minOrder: 10,
      deliveryFee: 2.99
    });
    console.log('Created restaurant');

    // Create menu items
    const menuItems = await MenuItemModel.create([
      {
        name: 'Margherita Pizza',
        description: 'Classic pizza with tomato sauce and mozzarella',
        price: 12.99,
        category: 'Pizza',
        restaurant: restaurant._id,
        image: '/images/margherita-pizza.png',
        available: true
      },
      {
        name: 'Chicken Burger',
        description: 'Grilled chicken burger with lettuce and special sauce',
        price: 8.99,
        category: 'Burgers',
        restaurant: restaurant._id,
        image: '/images/chicken-burger.png',
        available: true
      },
      {
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with Caesar dressing and croutons',
        price: 7.99,
        category: 'Salads',
        restaurant: restaurant._id,
        image: '/images/caesar-salad.png',
        available: true
      }
    ]);
    console.log('Created menu items');

    // Create a sample order
    const order = await OrderModel.create({
      user: admin._id,
      restaurant: restaurant._id,
      items: [
        {
          menuItem: menuItems[0]._id,
          quantity: 2,
          price: menuItems[0].price
        }
      ],
      totalAmount: menuItems[0].price * 2,
      status: 'completed',
      deliveryAddress: 'Indiranagar, 100 Feet Road, HSR Layout, Bangalore, Karnataka 560038',
      paymentMethod: 'credit_card',
      paymentStatus: 'paid'
    });
    console.log('Created sample order');

    console.log('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeder
seedDatabase(); 