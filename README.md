# AI Delivers Food

A modern food delivery application with real-time order tracking and AI-powered features. Built with a React/TypeScript frontend and Node.js/Express/TypeScript backend.

## ✨ Features

- 🗺️ Real-time order tracking with Google Maps integration
- 🏪 Restaurant and delivery location visualization
- 📦 Order status updates with Material-UI Stepper
- 🔌 WebSocket-based real-time updates
- 📱 Responsive design for all devices
- 🔐 JWT-based authentication
- 🐳 Docker support for easy deployment

## 🛠 Tech Stack

### Frontend
- React 19 with TypeScript
- Material-UI (MUI) for components
- Google Maps API for location tracking
- Socket.IO client for real-time updates
- Axios for API requests

### Backend
- Node.js with Express
- TypeScript
- MongoDB with Mongoose ODM
- Socket.IO for real-time communication
- Google Maps Geocoding API
- JWT for authentication
- Winston for logging

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher) or yarn
- MongoDB (local or MongoDB Atlas)
- Google Maps API key with Geocoding and Maps JavaScript API enabled

### Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-delivers-food.git
   cd ai-delivers-food
   ```

2. Set up environment variables:
   - Create `.env` files in both `backend` and `frontend` directories
   - Use the examples below as a reference

#### Backend (backend/.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai_delivers_food
JWT_SECRET=your_secure_jwt_secret
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
RESTAURANT_ADDRESS=123 Main St, City, Country
NODE_ENV=development
```

#### Frontend (frontend/.env)
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Installation

1. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

### Running Locally

1. Start the backend server (from backend directory):
   ```bash
   npm run dev
   ```

2. In a new terminal, start the frontend development server (from frontend directory):
   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Running with Docker

1. Make sure Docker and Docker Compose are installed
2. From the project root, run:
   ```bash
   docker-compose up --build
   ```
3. The application will be available at [http://localhost:3000](http://localhost:3000)

## 📚 API Documentation

API documentation is available at `/api-docs` when running the backend server in development mode.

## 🧪 Testing

Run tests for the backend:
```bash
cd backend
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [React](https://reactjs.org/)
- [Material-UI](https://mui.com/)
- [Socket.IO](https://socket.io/)
- [Google Maps Platform](https://mapsplatform.google.com/)
- [Socket.IO](https://socket.io/)
- [Google Maps API](https://developers.google.com/maps)
- [TypeScript](https://www.typescriptlang.org/)

## Docker Setup

### Prerequisites
- Docker
- Docker Compose

### Running with Docker

1. Build and start the containers:
```bash
docker-compose up --build
```

2. Access the application:
- Frontend: http://localhost
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api-docs
- MongoDB: localhost:27017

3. Stop the containers:
```bash
docker-compose down
```

4. View logs:
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb
```

5. Rebuild a specific service:
```bash
docker-compose up --build backend
```

### Environment Variables
Create a `.env` file in the root directory with your configuration:
```
MONGODB_USERNAME=admin
MONGODB_PASSWORD=password123
JWT_SECRET=your_jwt_secret
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
RESTAURANT_ADDRESS=your_restaurant_address
``` 