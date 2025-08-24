import { pool } from "../../config/pool.config";

export const get_subscription_by_client_id = (client_id: string) => {
  return pool.query(
    `
        SELECT * FROM subscriptions WHERE client_id = $1 ORDER BY current_period_end DESC `,
    [client_id]
  );
};
