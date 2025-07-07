import { Router } from "express";
import {
  configureAppOrigin,
  getAppOrigins,
} from "../controllers/origins.controller";

const router = Router();

router.post("/:app_id", configureAppOrigin);
router.get("/:app_id", getAppOrigins);

export default router;
