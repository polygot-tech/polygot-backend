import { pool } from "../../config/pool.config";
import type { User } from "../../services/passport.service";

export const USER_QUERY = {
  get_user_by_email: (email: string) => {
    return pool.query<User>("SELECT * FROM users where email = $1", [email]);
  },
};
