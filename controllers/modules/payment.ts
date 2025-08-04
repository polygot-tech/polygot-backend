import { pool } from "../../config/pool.config";
import type { SubscriptionStatus } from "../types/paymentType";

export type PaymentStatus = "failed" | "succeeded" | "processing" | "cancelled";
export const PAYMENT_QUERY = {
  create_transaction: (
    t_id: string,
    user_id: Number,
    payment_method: string,
    plan_type: string,
    total_amount: Number,
    payment_status: PaymentStatus
  ) => {
    return pool.query(
      "INSERT INTO transactions (t_id,user_id,payment_method,plan_type,total_amount,payment_status) VALUES( $1, $2, $3, $4, $5 )",
      [t_id, user_id, payment_method, plan_type, total_amount, payment_status]
    );
  },
  apply_subscription: (
    client_id: string,
    plan_id: string,
    dodo_customer_id: string,
    status: SubscriptionStatus,
    current_period_end: Date
  ) => {
    return pool.query(
      `INSERT INTO subscriptions
      (client_id, plan_id, dodo_customer_id, status, current_period_end) VALUES ( $1, $2, $3, $4, $5 )`,
      [client_id, plan_id, dodo_customer_id, status, current_period_end]
    );
  },
};
