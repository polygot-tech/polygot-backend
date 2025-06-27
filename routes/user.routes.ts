import { Router } from 'express';
import { getMe, authCheck } from '../controllers/user.controller';

const router = Router();

// A protected route to check if a user is authenticated and get their data
router.get('/me', authCheck, getMe);

export default router;
