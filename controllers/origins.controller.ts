import { z } from "zod";
import ApiResponse from "../utils/apiResponse";
import type { Request, Response } from "express";
import { prettifyError } from "zod/v4";
import { pool } from "../config/pool.config";
import { id } from "zod/v4/locales";
const addOriginSchema = z.object({
  origins: z.string().trim(),
});
export const configureAppOrigin = async (req: Request, res: Response) => {
  const { app_id } = req.query;
  if (!app_id) {
    ApiResponse.error(res, 400, "missing app_id in params.");
  }

  const parsed = addOriginSchema.safeParse(req.body);
  const { client_id } = req.user as { client_id?: string };
  if (!client_id) {
    ApiResponse.error(res, 401, "Unauthorized.");
  }
  if (!parsed.success) {
    return ApiResponse.error(res, 400, prettifyError(parsed.error));
  }
  const { origins } = parsed.data;
  const originArray = origins.split(",").map((o) => o.trim());
  try {
    const result = await pool.query(
      "SELECT * FROM apps where app_id = $1 and client_id = $2",
      [app_id, client_id]
    );
    if (result.rows.length == 0)
      return ApiResponse.error(
        res,
        401,
        "app_id does not belong to the  client_id."
      );
    const allowedOrigins = (
      await pool.query("SELECT * FROM origins where app_id = $1", [app_id])
    ).rows.map((o) => o.origin);

    const toDelete = allowedOrigins.filter((o) => !originArray.includes(o));
    const toAdd = originArray.filter(
      (o) => !allowedOrigins.includes(o) && o != ""
    );

    console.log(toDelete, "\n", toAdd, "\n", originArray);

    for (const origin of toAdd) {
      console.log("adding ", origin);
      await pool.query("INSERT INTO origins(app_id,origin) values( $1, $2 )", [
        app_id,
        origin,
      ]);
    }
    for (const origin of toDelete) {
      await pool.query("DELETE from origins where origin = $1", [origin]);
    }
    return await ApiResponse(res, 200, "Origins configured successfully.");
  } catch (err) {
    console.log(err);
    let message = "Failed to configure origins.";
    if ((err.code = 23505)) message = "Origin already added for the app.";
    return ApiResponse.error(res, 500, message);
  }
};

const getAppOriginSchema = z.object({
  app_id: z.string().trim(),
});
export const getAppOrigins = async (req: Request, res: Response) => {
  const parsed = getAppOriginSchema.safeParse(req.query);
  if (!parsed.success) {
    return ApiResponse.error(res, 400, prettifyError(parsed.error));
  }
  const { app_id } = parsed.data;
  const { client_id } = req.user as { client_id: string };

  try {
    const result = await pool.query(
      "SELECT * FROM origin_app_users_view where app_id = $1 and client_id = $2",
      [app_id, client_id]
    );
    return ApiResponse(res, 200, "Allowed Apps origin.", result.rows);
  } catch (err) {
    console.error(err);
    return ApiResponse.error(res, 500, "Database error.");
  }
};
