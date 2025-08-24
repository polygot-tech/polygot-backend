import type { Request, Response } from "express";
import ApiResponse from "../utils/apiResponse";
import { pool } from "../config/pool.config";

export const getAllApp = async (req: Request, res: Response) => {
  const { client_id } = req.user as { client_id: string };
  console.log("userData", req.user);
  try {
    const result = await pool.query("SELECT * FROM apps where client_id = $1", [
      client_id,
    ]);
    return ApiResponse(res, 200, "Fetched all apps.", result.rows);
  } catch (err) {
    return ApiResponse.error(res, 500, "Database Error");
  }
};
export const getApp = async (req: Request, res: Response) => {
  const { client_id } = req.user as { client_id: string };
  const { app_id } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM apps where client_id = $1 and app_id = $2",
      [client_id, app_id]
    );
    if (result.rows.length == 0) {
      return ApiResponse.error(
        res,
        404,
        "Invalid app_id, either it does not belong to you or its not present."
      );
    }
    return ApiResponse(
      res,
      200,
      `Fetched app ${result.rows[0].app_name}.`,
      result.rows[0]
    );
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
  const { app_id } = req.params;
  const { client_id } = req.user as { client_id: string };
  if (!app_id) {
    return ApiResponse.error(res, 400, "app_id is missing.");
  }
  try {
    const result = await pool.query(
      "DELETE FROM apps WHERE app_id = $1 and client_id = $2 ",
      [app_id, client_id]
    );
    if (result.rowCount == 0) {
      return ApiResponse.error(
        res,
        404,
        "This app_id is not under your scope or you don't have the permission."
      );
    }
    return ApiResponse(res, 200, "App deleted successfully.");
  } catch (err) {
    console.error(err);
    return ApiResponse.error(res, 500, "Failed to delete the app.");
  }
};

export const updateApp = async (req: Request, res: Response) => {
  const { app_id, is_active, production } = req.body;
  const { client_id } = req.user as { client_id: string };
  if (!app_id) {
    return ApiResponse.error(res, 400, "app_id is missing.");
  }
  let columns = [];
  let variables: any[] = [app_id, client_id];
  if (is_active != undefined) {
    variables.push(is_active);
    columns.push(`is_active = $${variables.length}`);
  }
  if (production != undefined) {
    variables.push(production);
    columns.push(`production = $${variables.length}`);
  }
  if (variables.length == 1) {
    ApiResponse.error(
      res,
      400,
      "No updates provided, either pass is_active:Boolean or production:boolean in body. "
    );
  }
  console.log(columns);
  try {
    const result = await pool.query(
      `UPDATE apps SET ${columns.join(
        ","
      )} where app_id = $1 and client_id = $2`,
      variables
    );
    if (result.rowCount == 0) {
      return ApiResponse.error(res, 401, "This app does not belong to you.");
    }
    return ApiResponse(
      res,
      200,
      `Your app is ${is_active == true ? "" : "not"} being translated.`,
      result.rows[0]
    );
  } catch (err) {
    console.error(err);
    return ApiResponse(res, 500, "Failed to update App status.");
  }
};
