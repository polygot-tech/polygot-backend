import type { Request, Response } from "express";

export const getMe = (req: Request, res: Response) => {
  res.status(200).json({ user: req.user });
};
