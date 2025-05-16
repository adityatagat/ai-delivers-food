"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../index"));
const User_1 = __importDefault(require("../models/User"));
describe('Auth API', () => {
    beforeEach(async () => {
        await User_1.default.deleteMany({});
    });
    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User'
            };
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/register')
                .send(userData);
            expect(response.status).toBe(201);
            expect(response.body.token).toBeDefined();
            expect(response.body.user.email).toBe(userData.email);
        });
        it('should not register user with existing email', async () => {
            await User_1.default.create({
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User'
            });
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/register')
                .send({
                email: 'test@example.com',
                password: 'password123',
                name: 'Another User'
            });
            expect(response.status).toBe(400);
        });
    });
    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await User_1.default.create({
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User'
            });
        });
        it('should login with valid credentials', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/login')
                .send({
                email: 'test@example.com',
                password: 'password123'
            });
            expect(response.status).toBe(200);
            expect(response.body.token).toBeDefined();
        });
        it('should not login with invalid credentials', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/login')
                .send({
                email: 'test@example.com',
                password: 'wrongpassword'
            });
            expect(response.status).toBe(401);
        });
    });
    describe('Email Verification', () => {
        it('should send verification email on registration', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User'
            };
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/register')
                .send(userData);
            expect(response.status).toBe(201);
            expect(response.body.user.isVerified).toBe(false);
        });
        it('should verify email with valid token', async () => {
            const user = await User_1.default.create({
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User'
            });
            user.generateVerificationToken();
            await user.save();
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/verify-email')
                .send({ token: user.verificationToken });
            expect(response.status).toBe(200);
            const verifiedUser = await User_1.default.findById(user._id);
            expect(verifiedUser === null || verifiedUser === void 0 ? void 0 : verifiedUser.isVerified).toBe(true);
        });
        it('should not verify email with invalid token', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/verify-email')
                .send({ token: 'invalid-token' });
            expect(response.status).toBe(400);
        });
    });
});
