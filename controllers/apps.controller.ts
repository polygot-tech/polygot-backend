import type { Request, Response } from "express";
import ApiResponse from "../utils/apiResponse";
import { pool } from "../config/pool.config";

export const getAllApp = async (req: Request, res: Response) => {
  const { client_id } = req.user as { client_id: string };
  try {
    const result = await pool.query("SELECT * FROM apps where client_id = $1", [
      client_id,
    ]);
    return ApiResponse(res, 200, "Fetched all apps.", result.rows);
  } catch (err) {
    return ApiResponse.error(res, 500, "Database Error");
  }
};

export const addApp = async (req: Request, res: Response) => {
  const { app_name } = req.body;
  const { client_id } = req.user as { client_id: string };
  if (!app_name) {
    return ApiResponse(res, 400, "app_name is missing.");
  }
  try {
    const result = await pool.query(
      "insert into apps(app_name,client_id) values($1,$2)",
      [app_name, client_id]
    );
    return ApiResponse(res, 201, "App created Successfully", result.rows[0]);
  } catch (error) {
    console.error(error);
    return ApiResponse.error(res, 500, "Database Error.");
  }
};

export const deleteApp = async (req: Request, res: Response) => {
  const { app_id } = req.body;
  if (!app_id) {
    return ApiResponse.error(res, 400, "app_id is missing.");
  }
  try {
    await pool.query("DELETE FROM apps WHERE app_id = $1 ", [app_id]);
    return ApiResponse(res, 200, "App deleted successfully.");
  } catch (err) {
    console.error(err);
    return ApiResponse.error(res, 500, "Failed to delete the app.");
  }
};

export const updateAppStatus = async (req: Request, res: Response) => {
  const { app_id, is_active } = req.body;
  if (!app_id) {
    return ApiResponse.error(res, 400, "app_id is missing.");
  }
  if (!is_active) {
    return ApiResponse.error(res, 400, "is_active is missing.");
  }
  try {
    const result = await pool.query(
      "UPDATE apps SET is_active = $1 where app_id = $2",
      [is_active, app_id]
    );
    return ApiResponse(
      res,
      200,
      `Your app is ${is_active ? "" : "not"} being translated.`,
      result.rows[0]
    );
  } catch (err) {
    console.error(err);
    return ApiResponse(res, 500, "Failed to update App status.");
  }
};
