"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendVerification = exports.verifyEmail = exports.getProfile = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const emailService_1 = require("../services/emailService");
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ _id: userId }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
};
const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        // Check if user already exists
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: 'Email already registered' });
            return;
        }
        // Create new user
        const user = new User_1.default({
            email,
            password,
            name
        });
        // Generate verification token
        user.generateVerificationToken();
        await user.save();
        // Send verification email - don't await to prevent registration failure if email fails
        (0, emailService_1.sendVerificationEmail)(user.email, user.verificationToken)
            .catch(err => console.error('Email verification error (non-blocking):', err));
        // Generate token
        const token = generateToken(user._id);
        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                isVerified: user.isVerified
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ message: 'Error registering user', error });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find user
        const user = await User_1.default.findOne({ email });
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        // Generate token
        const token = generateToken(user._id);
        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    }
    catch (error) {
        res.status(400).json({ message: 'Error logging in', error });
    }
};
exports.login = login;
const getProfile = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id).select('-password');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching profile', error });
    }
};
exports.getProfile = getProfile;
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User_1.default.findOne({
            verificationToken: token,
            verificationTokenExpires: { $gt: Date.now() }
        });
        if (!user) {
            res.status(400).json({ message: 'Invalid or expired verification token' });
            return;
        }
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();
        res.json({ message: 'Email verified successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error verifying email', error });
    }
};
exports.verifyEmail = verifyEmail;
const resendVerification = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        if (user.isVerified) {
            res.status(400).json({ message: 'Email already verified' });
            return;
        }
        user.generateVerificationToken();
        await user.save();
        await (0, emailService_1.sendVerificationEmail)(user.email, user.verificationToken);
        res.json({ message: 'Verification email sent' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error sending verification email', error });
    }
};
exports.resendVerification = resendVerification;
