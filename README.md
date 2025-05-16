# AI Delivers Food

A modern food delivery application with real-time order tracking and AI-powered features.

## Features

- Real-time order tracking with Google Maps integration
- Restaurant and delivery location visualization
- Order status updates with Material-UI Stepper
- WebSocket-based real-time updates
- Responsive design for all devices

## Tech Stack

### Frontend
- React with TypeScript
- Material-UI for components
- Google Maps API for location tracking
- Socket.IO client for real-time updates

### Backend
- Node.js with Express
- TypeScript
- MongoDB for data storage
- Socket.IO for real-time communication
- Google Maps Geocoding API

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Google Maps API key
- Socket.IO

## Environment Variables

Create `.env` files in both frontend and backend directories:

### Backend (.env)
```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
RESTAURANT_ADDRESS=your_restaurant_address
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-delivers-food.git
cd ai-delivers-food
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Start the development servers:
```bash
# Start backend server (from backend directory)
npm run dev

# Start frontend server (from frontend directory)
npm start
```

## API Documentation

API documentation is available at `/api-docs` when running the backend server.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
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