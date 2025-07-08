import { Router } from "express"
import {
  checkApiKeyExists,
  createApiKey,
  getApiKeyByCredentials
} from "../controllers/keys.controller"

const router = Router()

router.post("/check-api-key", checkApiKeyExists)

router.post("/create-api-key", createApiKey)

router.post("/get-api-key", getApiKeyByCredentials)

export default router
