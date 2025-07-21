import { Router } from "express";
import { translate } from "../controllers/translate.controller";
// import { apiKeyCheck } from "../middleware/key.middleware";
import { originCheck } from "../middleware/originCheck.middleware";
// import { originCheck } from "../middleware/originCheck.middleware";

const router = Router();

router.post("/", originCheck, translate);

export default router;
