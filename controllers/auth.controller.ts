import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

export const googleCallback = (req: Request, res: Response) => {
  const uiRootUri = process.env.UI_ROOT_URI;
  console.log(uiRootUri);
  const jwtSecret = process.env.JWT_SECRET!;

  const user = req.user as { id: number; email: string };
  console.log(user);

  const payload = {
    id: user.id,
    email: user.email,
  };

  // Sign the token
  const token = jwt.sign(payload, jwtSecret, { expiresIn: "1000d" });

  console.log("Redirecting to frontend with JWT.");
  res.redirect(`${uiRootUri}/auth/callback?token=${token}`);
};

export const logout = (req: Request, res: Response) => {
  res
    .status(200)
    .json({ message: "Successfully logged out. Please delete your token." });
};
