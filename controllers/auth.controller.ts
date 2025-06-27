import type { Request, Response } from 'express';

export const googleCallback = (req: Request, res: Response) => {
    const uiRootUri = process.env.UI_ROOT_URI || 'http://localhost:5173';
    console.log('Redirecting to frontend:', `${uiRootUri}/dashboard`);
    res.redirect(`${uiRootUri}/dashboard`);
};

export const logout = (req: Request, res: Response) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ message: 'Error logging out.' });
        }
        req.session.destroy((destroyErr) => {
            if (destroyErr) {
                 console.error("Session destruction error:", destroyErr);
                 return res.status(500).json({ message: 'Could not destroy session.' });
            }
            res.clearCookie('connect.sid'); 
            res.status(200).json({ message: 'Successfully logged out' });
        });
    });
};
