import { Router } from 'express';
import { translate } from '../controllers/translate.controller';
import { createPaymentLink, paymentsWebhook } from '../controllers/payments.controller';

const router = Router();

router.post(
    '/',
    createPaymentLink
);

router.post(
    '/webhook',
    paymentsWebhook
)


export default router;
