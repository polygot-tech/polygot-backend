import type { Request, Response, NextFunction } from "express";
import { pool } from "../config/pool.config";
import ApiResponse from "../utils/apiResponse";
import { plansConfig } from "../controllers/payments.controller";
import { getSubscriptionRemainingUsage } from "./modules/subscriptionUtils";

export async function originCheck(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const app_id = req.headers["app-id"] as string;
  const origin = req.headers.origin;
  let subscription_id: string = "";
  try {
    res.on("finish", () => {
      (async () => {
        if (res.statusCode == 200) {
          try {
            if (subscription_id) {
              await pool.query(
                `UPDATE subscriptions SET translation_usage =  translation_usage + $1 WHERE id = $2`,
                [1, subscription_id]
              );
              await pool.query(
                `UPDATE apps SET translations_done = translations_done+$1, api_calls = api_calls +$2 where app_id = $3 `,
                [1, 1, app_id]
              );
            }
          } catch (e) {
            console.log("Tracking error", app_id, e);
          }
        } else {
          await pool.query(
            `UPDATE apps SET api_calls = api_calls +$1 WHERE app_id = $2`,
            [1, app_id]
          );
        }
      })();
    });
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
      let subscription;
      req.monitor = result.rows[0];
      if (req.monitor?.is_active) {
        if (req.monitor?.production && origin.includes("localhost")) {
          return ApiResponse.error(
            res,
            401,
            "Your app is in production mode. Hence it cannot be accessed from localhost."
          );
        }
        const result = (
          await pool.query(
            `SELECT * FROM apps a JOIN subscriptions s ON s.client_id=a.client_id WHERE a.app_id= $1 AND s.status= $2 ORDER BY s.current_period_end`,
            [app_id, "active"]
          )
        ).rows;
        if (result.length > 1) {
          subscription = result.find((subscription) => {
            subscription.plan_id != plansConfig.FREE.db_p_id;
          });
        } else if (result.length == 1) {
          subscription = result[0];
        }
        if(!subscription)return ApiResponse.error(res,401," No active subscriptions.")
        subscription_id = subscription.id;
        if ((await getSubscriptionRemainingUsage(subscription)) > 0) next();
        else ApiResponse.error(res, 429, "Limits Exceeded please upgrade");
      } else {
        return ApiResponse.error(res, 400, "Your app is not active.");
      }
    } else {
      return ApiResponse.error(
        res,
        401,
        `Origin Not Allowed. Please add ${origin} as your trusted origin on polygot.`
      );
    }
  } catch (e) {
    console.trace(e, "origin middleware failed.");
  }
}
