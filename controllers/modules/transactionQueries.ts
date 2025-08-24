import { pool } from "../../config/pool.config";
import type { PaymentStatus } from "./payment";

export const createTransaction = (
  t_id: string,
  user_id: number,
  payment_method: string,
  plan_type: string,
  total_amount: number,
  payment_status: string
) => {
  return pool.query(
    `
       INSERT INTO transactions(t_id, user_id, payment_method, plan_type, total_amount, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6 ) ON CONFLICT (t_id) DO NOTHING
        `,
    [t_id, user_id, payment_method, plan_type, total_amount, payment_status]
  );
};

export const getTransactionById = (t_id: string) => {
  console.log("t-id", t_id);
  return pool.query(
    `
        SELECT * FROM transactions WHERE t_id = $1`,
    [t_id]
  );
};

export const updateTransactionStatus = (
  t_id: string,
  status: PaymentStatus
) => {
  return pool.query(
    `
        UPDATE transactions SET payment_status = $1 WHERE t_id = $2
        `,
    [status, t_id]
  );
};
