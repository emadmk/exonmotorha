import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { otpLimiter, authLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// POST /api/auth/send-otp - Send OTP to phone
router.post('/send-otp', otpLimiter, authController.sendOTP);

// POST /api/auth/verify-otp - Verify OTP and login/register
router.post('/verify-otp', authLimiter, authController.verifyOTP);

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', authController.refreshToken);

// POST /api/auth/logout - Logout user
router.post('/logout', authenticate, authController.logout);

// GET /api/auth/me - Get current user
router.get('/me', authenticate, authController.getCurrentUser);

export default router;
