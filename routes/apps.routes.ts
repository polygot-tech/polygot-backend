import { Router } from "express";
import {
  addApp,
  deleteApp,
  getAllApp,
  getApp,
  updateApp,
} from "../controllers/apps.controller";

const router = Router();

router.get("/", getAllApp);
router.get("/:app_id", getApp);
router.post("/", addApp);
router.delete("/:app_id", deleteApp);
router.put("/", updateApp);

export default router;
