import { Router, Request, Response, NextFunction } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Type-safe wrapper for async route handlers
const asyncHandler = (fn: Function) => 
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

// @route   POST /api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', asyncHandler(AuthController.register));

// @route   POST /api/auth/login
// @desc    Login user & get token
// @access  Public
router.post('/login', asyncHandler(AuthController.login));

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authMiddleware, (req: Request, res: Response) => {
    AuthController.getCurrentUser(req as AuthRequest, res);
});

export default router; 