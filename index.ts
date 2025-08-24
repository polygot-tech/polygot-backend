import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";

import authRoutes from "./routes/auth.routes";
import translateRoutes from "./routes/translate.routes";
import userRoutes from "./routes/user.routes";
import appsRoutes from "./routes/apps.routes";
import originRoutes from "./routes/origin.routes";
import "./services/passport.service";
import { connectRedis } from "./config/redis.config";
import { authenticateJWT } from "./middleware/auth.middleware";
import paymentRoutes from "./routes/payments.routes";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;
app.set("trust proxy", 1);

const allowedOrigins = process.env.ALLOWED_ORIGIN?.split(",").map((origin) =>
  origin.trim()
) || [
  "https://polygot-react.vercel.app",
  "https://polygot.tech",
  "http://localhost:5173",
  "http://localhost:3001",
];

app.use(express.json());
connectRedis();

app.use(passport.initialize());

app.use(
  "/api/v1/translate",
  cors({
    origin: "*",
    credentials: false,
  }),
  translateRoutes
);

const authCors = cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow the request
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
});

app.use("/api/v1/auth", authCors, authRoutes);

app.use("/api/v1/user", authCors, authenticateJWT, userRoutes);
app.use("/api/v1/apps", authCors, authenticateJWT, appsRoutes);
app.use("/api/v1/origins", authCors, authenticateJWT, originRoutes);
app.use("/api/v1/payments", authCors, paymentRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Visit the website at https://www.polygot.tech");
});

console.log("JWT_SECRET is set:", !!process.env.JWT_SECRET);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
