import { Router } from "express";
import { translate } from "../controllers/translate.controller";
import { originCheck } from "../middleware/originCheck.middleware";

const router = Router();

router.post("/", translate);

export default router;
