import { Router } from "express";
import {
  addApp,
  deleteApp,
  getAllApp,
  updateAppStatus,
} from "../controllers/apps.controller";

const router = Router();

router.get("/", getAllApp);
router.post("/", addApp);
router.delete("/", deleteApp);
router.put("/is-active", updateAppStatus);

export default router;
