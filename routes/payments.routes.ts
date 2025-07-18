import { Router } from 'express';
import { translate } from '../controllers/translate.controller';
import { apiKeyCheck } from '../middleware/key.middleware';

const router = Router();

router.post(
    '/create-payment-link',
    apiKeyCheck,
    translate
);


export default router;
