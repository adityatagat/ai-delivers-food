# AI Delivers Food - Backend

This is the backend for the AI Delivers Food platform, a food delivery service that uses AI to enhance the ordering and delivery experience.

## 🚀 Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (RBAC)
  - Secure password hashing with bcrypt
  - Refresh token support

- **Security**
  - Helmet.js for security headers
  - Rate limiting (100 requests per 15 minutes per IP)
  - CORS with environment-specific origins
  - Input validation with express-validator
  - Request sanitization
  - Protection against common web vulnerabilities (XSS, CSRF, etc.)

- **Error Handling & Logging**
  - Global error handling middleware
  - Structured logging with Winston
  - Request/response logging with sensitive data redaction
  - Uncaught exception and unhandled rejection handlers
  - Process signal handlers for graceful shutdown

- **API Features**
  - RESTful API design
  - Real-time updates with WebSockets
  - Comprehensive API documentation with Swagger
  - Request ID tracking
  - Response time headers

- **Performance**
  - Response compression
  - Request rate limiting
  - Efficient database queries with Mongoose
  - Caching support (Redis recommended for production)

## 🛠 Tech Stack

- **Runtime**: Node.js 16+
- **Language**: TypeScript 4.7+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO
- **Authentication**: JWT, bcrypt
- **API Docs**: Swagger/OpenAPI
- **Testing**: Jest, Supertest
- **Logging**: Winston with Daily Rotate File
- **Validation**: express-validator
- **Security**: Helmet, express-rate-limit, cors
- **Process Management**: PM2 (recommended for production)

## 🔒 Security Features

### Request Validation
- All user input is validated using `express-validator`
- Custom validation middleware for common validation patterns
- Protection against NoSQL injection
- Protection against XSS attacks

### Authentication & Authorization
- JWT-based stateless authentication
- Role-based access control (RBAC)
- Secure password hashing with bcrypt
- Token refresh mechanism
- Token blacklisting support

### Headers & Security
- Helmet.js for setting various HTTP headers
- Strict Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- XSS protection
- Frame options
- MIME-type sniffing prevention
- X-Powered-By header removal

### Rate Limiting
- 100 requests per 15 minutes per IP by default
- Configurable via environment variables
- Whitelist support for trusted IPs

### Logging & Monitoring
- Structured JSON logging
- Separate log files for different log levels
- Request/response logging with sensitive data redaction
- Error tracking and reporting
- Performance metrics
- Request validation using express-validator
- Common validation rules for email, password, and object IDs
- Sanitization of user input

### 4. Error Handling
- Centralized error handling middleware
- Consistent error responses
- Proper HTTP status codes
- Development vs production error details

### 5. CORS Protection
- Strict CORS policy
- Configurable allowed origins
- Credentials support

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/ai-delivers-food

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_TO_FILE=true
LOG_DIR=logs

# Email (optional for notifications)
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=user@example.com
# SMTP_PASS=yourpassword
# EMAIL_FROM=noreply@ai-delivers-food.com
```

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-delivers-food.git
   cd ai-delivers-food/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## API Documentation

API documentation is available at `/api-docs` when the server is running in development mode.

## Testing

Run unit tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Security Best Practices

1. Always use HTTPS in production
2. Keep dependencies up to date
3. Use environment variables for sensitive configuration
4. Implement proper input validation
5. Use prepared statements for database queries
6. Implement rate limiting
7. Use secure headers
8. Regular security audits

## Logging

Logs are stored in the `logs/` directory with the following structure:
- `combined.log`: All logs
- `error.log`: Error logs
- `http.log`: HTTP request/response logs

Log levels: `error`, `warn`, `info`, `http`, `verbose`, `debug`, `silly`

## Process Management

For production, it's recommended to use a process manager like PM2:

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start dist/index.js --name "ai-delivers-food"

# View logs
pm2 logs ai-delivers-food

# Monitor application
pm2 monit
```

## Deployment

### Prerequisites
- Node.js 16+
- MongoDB 4.4+
- Redis (recommended for caching and rate limiting in production)

### Steps
1. Clone the repository
2. Install dependencies: `npm install`
3. Build the application: `npm run build`
4. Start the server: `npm start`

For production, consider using:
- Nginx as a reverse proxy
- PM2 for process management
- MongoDB Atlas for managed MongoDB
- Redis for caching and rate limiting
- A monitoring solution (e.g., New Relic, Datadog)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Express.js team
- MongoDB and Mongoose teams
- All open-source contributors
