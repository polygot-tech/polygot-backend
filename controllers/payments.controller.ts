import express, { type Request, type Response } from "express";
import { dodoPayments } from "../config/dodo.config";
import { config } from "dotenv";
import {
  Webhook,
  type WebhookUnbrandedRequiredHeaders,
} from "standardwebhooks";
import { EventEmitter } from "stream";
import z from "zod";
import ApiResponse from "../utils/apiResponse";
import { USER_QUERY } from "./modules/users";
import type { SubscriptionStatus, webHookPayload } from "./types/paymentType";
import { pool } from "../config/pool.config";
import { PAYMENT_QUERY } from "./modules/payment";
import { get_subscription_by_client_id } from "./modules/subscriptionQueries";
import {
  createTransaction,
  getTransactionById,
  updateTransactionStatus,
} from "./modules/transactionQueries";

const sseEmitter = new EventEmitter();

type Plans = "PRO" | "BUSINESS" | "FREE";
export const plansConfig: Record<
  Plans,
  { dodo_p_id: string; db_p_id: string; duration: number }
> = {
  PRO: {
    dodo_p_id: "pdt_nELJwVPbXrThMTngkwFTN",
    db_p_id: "e0a10afe-6fc6-42b8-8462-f0ddea774269",
    duration: 1,
  },
  BUSINESS: {
    dodo_p_id: "pdt_75q6BzNM8RLwLfaO3NbRS",
    db_p_id: "70bc1bbf-d084-45f6-9e45-ac9cd00fe00d",
    duration: 3,
  },
  FREE: {
    dodo_p_id: "polygot",
    db_p_id: "5f5a99fe-995c-41ae-a742-be1c51dd2799",
    duration: 1,
  },
};
config();
const paymentLinkSchema = z.object({
  customer: z.object({
    city: z.string(),
    country: z.string(),
    state: z.string(),
    street: z.string(),
    zipcode: z.string(),
    email: z.string(),
    name: z.string(),
  }),
  type: z.enum(["PRO", "BUSINESS"]),
});
export async function createPaymentLink(req: Request, res: Response) {
  try {
    const safeBody = paymentLinkSchema.safeParse(req.body);
    if (!safeBody.success) {
      return ApiResponse.error(res, 400, z.prettifyError(safeBody.error));
    }
    const { customer, type } = safeBody.data;

    const user = await USER_QUERY.get_user_by_email(customer.email);
    let UserResult = user.rows[0];
    if (user.rows.length == 0) {
      console.log("creating new user.");
      UserResult = (
        await pool.query(
          "INSERT INTO users (email, name ) VALUES ($1, $2) RETURNING *",
          [customer.email, customer.name]
        )
      ).rows[0];
    }
    const payment = await dodoPayments.payments.create({
      payment_link: true,
      return_url: `http://localhost:3001/pricing/${type}`,
      billing: {
        city: customer.city,
        country: customer.country as any,
        state: customer.state,
        street: customer.street,
        zipcode: customer.zipcode,
      },
      customer: {
        email: customer.email,
        name: customer.name,
      },
      product_cart: [
        {
          product_id: plansConfig[type].dodo_p_id as string,
          quantity: 1,
        },
      ],
    });

    res.json({ paymentLink: payment.payment_link });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create payment link" });
  }
}

const webhook = new Webhook(process.env.DODO_WEBHOOK_SECRET as string);

export async function paymentsWebhook(req: Request, res: Response) {
  try {
    const body: webHookPayload = req.body;

    const webhookHeaders: WebhookUnbrandedRequiredHeaders = {
      "webhook-id": (req.headers["webhook-id"] || "") as string,
      "webhook-signature": (req.headers["webhook-signature"] || "") as string,
      "webhook-timestamp": (req.headers["webhook-timestamp"] || "") as string,
    };

    const raw = JSON.stringify(body);

    await webhook.verify(raw, webhookHeaders);
    const customer = body.data.customer;
    const { email, name } = customer;
    const UserResult = (await USER_QUERY.get_user_by_email(email)).rows.at(0);
    if (!UserResult) {
      return ApiResponse.error(
        res,
        401,
        "The payment cannot be processed as it cannot be associated with any user."
      );
    }
    const transaction = (await getTransactionById(body.data.payment_id))
      .rows[0];
    await createTransaction(
      body.data.payment_id,
      UserResult.id,
      body.data.payment_method,
      body.data.product_cart.at(0)?.product_id || "",
      body.data.total_amount,
      body.data.status
    );
    if (body.data.status == "succeeded") {
      if (transaction?.payment_status == "succeeded") {
        return ApiResponse.error(res, 200, "Transaction already processed.");
      } else if (transaction?.PaymentStatus != "succeeded") {
        updateTransactionStatus(body.data.payment_id, body.data.status);
      }
      const subscription = await get_subscription_by_client_id(
        UserResult.client_id
      );
      let current_period_end;
      const product_id = body.data.product_cart[0]?.product_id;
      const product = Object.values(plansConfig).find(
        (p) => p.dodo_p_id == product_id
      );
      if (!product) {
        return ApiResponse.error(res, 400, "Cannot determine plans");
      }
      const duration = product.duration;
      let status: SubscriptionStatus = "active";
      if (subscription.rows.length == 0) {
        current_period_end = new Date();
        current_period_end.setMonth(current_period_end.getMonth() + duration);
      } else {
        current_period_end = new Date(subscription.rows[0].current_period_end);
        const current_date = new Date();
        if (current_period_end < current_date)
          current_period_end = current_date;
        else if (subscription.rows[0].plan_id != plansConfig["FREE"]) {
          status = "upcoming";
        }
        current_period_end.setMonth(current_period_end.getMonth() + duration);
      }

      await PAYMENT_QUERY.apply_subscription(
        UserResult.client_id,
        product.db_p_id,
        body.data.customer.customer_id,
        status,
        current_period_end
      );
      res.status(200).json({ received: true });
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    ApiResponse.error(res, 401, "Invalid");
  }
}
