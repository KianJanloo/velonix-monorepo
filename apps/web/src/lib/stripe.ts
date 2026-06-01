import { loadStripe, type Stripe } from "@stripe/stripe-js";

/**
 * Singleton Stripe.js promise. loadStripe should only be called once per page
 * load, so we memoise it at module scope and reuse it across the checkout flow.
 */
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"];
    // Resolve to null when unconfigured so the UI can show a friendly message
    // instead of throwing during render.
    stripePromise = key ? loadStripe(key) : Promise.resolve(null);
  }
  return stripePromise;
}
