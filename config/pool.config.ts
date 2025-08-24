import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DB_URL,
});
const originalQuery = pool.query;
pool.query = function (query, values, cb) {
  console.log(query, values);
  return originalQuery.call(this, query, values, cb);
};
pool
  .connect()
  .then(() => console.log("Database Connected."))
  .catch((e) => {
    console.log(e);
    console.log("Failed to connect to database.");
  });
