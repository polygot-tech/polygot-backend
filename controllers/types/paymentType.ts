export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "pending_payment"
  | "upcoming";
export type PaymentStatus = "succeeded" | "failed";
export type webHookPayload = {
  business_id: string;
  data: {
    billing: {
      city: string;
      country: string;
      state: string;
      street: string;
      zipcode: string;
    };
    brand_id: string;
    business_id: string;
    card_issuing_country: string | null;
    card_last_four: string | null;
    card_network: string | null;
    card_type: string | null;
    created_at: string; // ISO date string
    currency: string;
    customer: {
      customer_id: string;
      email: string;
      name: string;
    };
    digital_products_delivered: boolean;
    discount_id: string | null;
    disputes: any[]; // could be typed further if structure is known
    error_code: string | null;
    error_message: string | null;
    metadata: Record<string, any>;
    payload_type: "Payment";
    payment_id: string;
    payment_link: string;
    payment_method: "upi" | string; // union can be extended for other methods
    payment_method_type: "upi_intent" | string;
    product_cart: { product_id: string; quantity: number }[]; // can refine if you know product object shape
    refunds: any[]; // can refine if structure is known
    settlement_amount: number;
    settlement_currency: string;
    settlement_tax: number;
    status: PaymentStatus;
    subscription_id: string | null;
    tax: number;
    total_amount: number;
    updated_at: string | null;
  };
  timestamp: string;
  type: "payment.succeeded" | string;
};
