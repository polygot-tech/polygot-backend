import type { Request, Response, NextFunction } from "express";
import { pool } from "../config/pool.config";
import type { User } from "../services/passport.service";
import ApiResponse from "../utils/apiResponse";

export const originCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const app_id = req.headers["app-id"];
  console.log(app_id);
  const origin = req.headers.origin;
  if (!app_id) {
    return ApiResponse(res, 400, "app_id is missing.");
  }
  if (!origin) {
    return ApiResponse(
      res,
      400,
      "Please send request from your webpage domain as origin."
    );
  }
  const result = await pool.query(
    "SELECT * FROM origin_app_users_view where app_id = $1 and origin = $2",
    [app_id, origin]
  );
  if (result.rows.length >= 1) {
    req.monitor = result.rows[0];
    return next();
  }
  return ApiResponse.error(
    res,
    401,
    `Origin Not Allowed. Please add ${origin} as your trusted origin on polygot.`
  );
};
