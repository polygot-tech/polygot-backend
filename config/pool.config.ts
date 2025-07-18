import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DB_URL,
});

pool
  .connect()
  .then(() => console.log("Database Connected."))
  .catch((e) => {
    console.log(e);
    console.log("Failed to connect to database.");
  });
