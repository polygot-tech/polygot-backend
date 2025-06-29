import { Router } from 'express';
import passport from 'passport';
import { googleCallback, logout } from '../controllers/auth.controller';

const router = Router();

router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
    '/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/login/failed',
        session: false,
    }),
    googleCallback
);
    
router.get('/logout', logout);

export default router;