import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if a user is authenticated.
 * Passport attaches the `isAuthenticated` method to the request object.
 */
export const authCheck = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'User is not authenticated' });
    }
    // If authenticated, proceed to the next middleware or route handler.
    next();
};

/**
 * Controller to get the current authenticated user's profile.
 */
export const getMe = (req: Request, res: Response) => {
    // If authCheck middleware passes, req.user will be populated.
    res.status(200).json({ user: req.user });
};
