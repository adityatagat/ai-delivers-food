"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Create a development transporter that doesn't actually send emails
const createDevTransporter = () => {
    return {
        sendMail: async (mailOptions) => {
            console.log('Development mode - Email not sent');
            console.log('To:', mailOptions.to);
            console.log('Subject:', mailOptions.subject);
            return { messageId: 'dev-mode' };
        }
    };
};
// Check if we should use a real email transporter or a mock one
const isEmailConfigured = process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS;
// Use a real transporter if SMTP settings are provided, otherwise use mock
const transporter = isEmailConfigured
    ? nodemailer_1.default.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    })
    : createDevTransporter();
const sendVerificationEmail = async (email, token) => {
    try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
        const mailOptions = {
            from: process.env.SMTP_FROM || 'noreply@aideliversfood.com',
            to: email,
            subject: 'Verify Your Email - AI Delivers Food',
            html: `
        <h1>Welcome to AI Delivers Food!</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>This link will expire in 24 hours.</p>
      `
        };
        await transporter.sendMail(mailOptions);
        console.log(`Verification email ${isEmailConfigured ? 'sent' : 'simulated'} to: ${email}`);
    }
    catch (error) {
        console.error('Error sending verification email:', error);
        // Don't throw the error - just log it and continue
        // This prevents registration failure due to email issues
    }
};
exports.sendVerificationEmail = sendVerificationEmail;
