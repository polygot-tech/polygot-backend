<<<<<<< HEAD
import type { Request, Response } from 'express';


export const getMe = (req: Request, res: Response) => {
    res.status(200).json({ user: req.user });
=======
import type { Request, Response } from "express";

export const getMe = (req: Request, res: Response) => {
  res.status(200).json({ user: req.user });
>>>>>>> f1f15823eb345f04f7971ab358359f1572c1c18f
};
