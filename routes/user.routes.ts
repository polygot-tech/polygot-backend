import { Router } from 'express';
import { getMe } from '../controllers/user.controller';
import { authCheck } from '../middleware/auth.middleware';

const router = Router();

// A protected route to check if a user is authenticated and get their data
router.get('/me', authCheck, getMe);

export default router;
