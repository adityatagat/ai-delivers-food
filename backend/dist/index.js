"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const http_1 = require("http");
const swagger_1 = require("./config/swagger");
const db_1 = __importDefault(require("./db"));
const socketService_1 = __importDefault(require("./services/socketService"));
const foodItemRoutes_1 = __importDefault(require("./routes/foodItemRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const trackingRoutes_1 = __importDefault(require("./routes/trackingRoutes"));
const menuRoutes_1 = __importDefault(require("./routes/menuRoutes"));
const restaurantRoutes_1 = __importDefault(require("./routes/restaurantRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const PORT = process.env.PORT || 5000;
// Initialize WebSocket server
socketService_1.default.initialize(httpServer);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Swagger documentation route
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.specs));
// Routes
app.use('/api/food-items', foodItemRoutes_1.default);
app.use('/api/orders', orderRoutes_1.default);
app.use('/api/auth', authRoutes_1.default);
app.use('/api/tracking', trackingRoutes_1.default);
app.use('/api/menu', menuRoutes_1.default);
app.use('/api/restaurant', restaurantRoutes_1.default);
app.get('/', (_req, res) => {
    res.send('AI Delivers Food! Backend is running with TypeScript and MongoDB.');
});
(0, db_1.default)();
if (process.env.NODE_ENV !== 'test') {
    httpServer.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
exports.default = app;
