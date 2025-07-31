import DodoPayments from 'dodopayments';
import { config } from 'dotenv';

config()
export const dodoPayments = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY,
  environment: 'test_mode',
});

