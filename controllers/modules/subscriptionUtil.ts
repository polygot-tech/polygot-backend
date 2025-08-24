import { pool } from "../../config/pool.config";
import type { Subscription } from "../../services/passport.service";

export const validateSubscription = async (id: string) => {
  const subscription: Subscription | undefined = (
    await pool.query("SELECT * FROM subscription WHERE id = $1", [id])
  ).rows.at(0);
  if (!subscription) return false;
  const date = new Date();
  const subscriptionExpiry = new Date(subscription.current_period_end);
  if (subscriptionExpiry < date) {
    if (subscription.status == "active") {
      await pool.query("UPDATE subscriptions SET status = $1 WHERE id = $2", [
        "past_due",
        id,
      ]);
    }
    return false;
  }
  const plan = await pool.query("SELECT * FROM plans WHERE id = $1 ", [
    subscription.plan_id,
  ]);
  const remaining_usage =
    plan.rows.at(0)?.translation_limit - subscription.translation_usage;
  subscription.remaining_usage = remaining_usage;
    if (remaining_usage <= 0) return false;
    return true;
};
