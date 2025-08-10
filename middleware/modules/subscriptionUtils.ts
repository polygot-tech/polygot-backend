import { pool } from "../../config/pool.config";

export const getSubscriptionRemainingUsage = async (subscription: {
  plan_id: string;
  translation_usage: number;
}) => {
  const plan = await pool.query("SELECT * FROM plans WHERE id = $1 ", [
    subscription.plan_id,
  ]);
  const remaining_usage =
    plan.rows.at(0)?.translation_limit - subscription.translation_usage;
  return remaining_usage;
};
