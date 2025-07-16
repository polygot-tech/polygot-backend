import { Router } from "express";
import {
  configureAppOrigin,
  getAppOrigins,
} from "../controllers/origins.controller";

const router = Router();

router.post("/", configureAppOrigin);
router.get("/", getAppOrigins);

export default router;
