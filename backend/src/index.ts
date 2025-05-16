import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { createServer } from 'http';
import { specs } from './config/swagger';
import connectDB from './db';
import socketService from './services/socketService';
import foodItemRoutes from './routes/foodItemRoutes';
import orderRoutes from './routes/orderRoutes';
import authRoutes from './routes/authRoutes';
import trackingRoutes from './routes/trackingRoutes';
import menuRoutes from './routes/menuRoutes';
import restaurantRoutes from './routes/restaurantRoutes';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize WebSocket server
socketService.initialize(httpServer);

app.use(cors());
app.use(express.json());

// Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api/food-items', foodItemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/restaurant', restaurantRoutes);

app.get('/', (_req, res) => {
  res.send('AI Delivers Food! Backend is running with TypeScript and MongoDB.');
});

connectDB();

if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;