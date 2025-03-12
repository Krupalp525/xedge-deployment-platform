import { Router, Request, Response, NextFunction } from 'express';
import AuthController from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
    return AuthController.register(req, res);
});

router.post('/login', async (req: Request, res: Response) => {
    return AuthController.login(req, res);
});

router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    return AuthController.getCurrentUser(req, res, next);
});

export default router; 