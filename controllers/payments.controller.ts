import express,  { type Request, type Response } from 'express';
import { dodoPayments } from '../config/dodo.config';
import { config } from 'dotenv';
import { Webhook, type WebhookUnbrandedRequiredHeaders } from "standardwebhooks";
import { EventEmitter } from 'stream';

const sseEmitter = new EventEmitter()

config()
export async function createPaymentLink(req:Request, res:Response){
     try {
    const { customer, type } = req.body; 
    
    const payment = await dodoPayments.payments.create({
      payment_link: true,
      return_url:`http://localhost:5173/pricing/${type}`,
      billing: {
        city:customer.city,
        country:customer.country,
        state:customer.state,
        street:customer.street,
        zipcode:customer.zipcode
      },
        customer:{
            email:customer.email,
            name:customer.name,
        },
      product_cart: [
        {
          product_id: "pdt_nELJwVPbXrThMTngkwFTN" as string,
          quantity: 1,
        },
      ],
    });

    res.json({ paymentLink: payment.payment_link });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create payment link' });
  }
}


const webhook = new Webhook(process.env.DODO_WEBHOOK_SECRET as string);

export async function paymentsWebhook(req:Request, res:Response){
try {
const body = req.body;

const webhookHeaders: WebhookUnbrandedRequiredHeaders = {
  "webhook-id": (req.headers["webhook-id"] || "") as string,
  "webhook-signature": (req.headers["webhook-signature"] || "") as string,
  "webhook-timestamp": (req.headers["webhook-timestamp"] || "") as string,
};

const raw = JSON.stringify(body);

const samePayloadOutput = await webhook.verify(raw, webhookHeaders);
console.log(samePayloadOutput == body); //should be true except the 
res.status(200).json({ received: true });
} catch (error) {
console.error('Error processing webhook:', error);
res.status(400).json({ error: 'Webhook handler failed' });
}
}
