import type { Request, Response, NextFunction } from 'express';

export const authCheck = (req: Request, res: Response, next: NextFunction) => {
    console.log(req.isAuthenticated(),"isAuthenticated")
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'User is not authenticated' });
    }
    next();
};