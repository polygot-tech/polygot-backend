import express,  { type Request, type Response } from 'express';
import { dodoPayments } from '../config/dodo.config';
import { config } from 'dotenv';

config()
export async function createPaymentLink(req:Request, res:Response){
     try {
    const { customer } = req.body; 

    const payment = await dodoPayments.payments.create({
      payment_link: true,
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
          product_id: process.env.DODO_PRODUCT_ID_29 as string,
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
