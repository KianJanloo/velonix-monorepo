import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { UserEntity } from "../users/user.entity";
import { SUBSCRIPTION_LIMITS } from "@velonix/types";
import type { SubscriptionTier } from "@velonix/types";

type BillingInterval = "monthly" | "yearly";

@Injectable()
export class SubscriptionsService {
  private _stripe?: Stripe;
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly config: ConfigService
  ) {}

  private get stripe(): Stripe {
    if (!this._stripe) {
      const key = this.config.get<string>("stripe.secretKey");
      if (!key) throw new BadRequestException("Stripe is not configured. Set STRIPE_SECRET_KEY.");
      this._stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia" });
    }
    return this._stripe;
  }

  /** Returns all tier details for the pricing page */
  getTiers() {
    return (["free", "creator", "pro", "studio"] as SubscriptionTier[]).map((tier) => ({
      tier,
      limits: SUBSCRIPTION_LIMITS[tier],
      prices: {
        monthly: this.config.get<string>(`stripe.prices.${tier}Monthly`) ?? null,
        yearly: this.config.get<string>(`stripe.prices.${tier}Yearly`) ?? null,
      },
    }));
  }

  /** Create or retrieve a Stripe customer for the user */
  async getOrCreateCustomer(userId: string) {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });

    if (user.stripeCustomerId) {
      return this.stripe.customers.retrieve(user.stripeCustomerId) as Promise<Stripe.Customer>;
    }

    const customer = await this.stripe.customers.create({
      email: user.email,
      name: user.displayName,
      metadata: { velonixUserId: userId },
    });

    await this.userRepo.update(userId, { stripeCustomerId: customer.id });
    return customer;
  }

  /** Create a Stripe Checkout session for a subscription upgrade */
  async createCheckoutSession(
    userId: string,
    tier: Exclude<SubscriptionTier, "free">,
    interval: BillingInterval
  ) {
    const customer = await this.getOrCreateCustomer(userId);
    const priceKey = `stripe.prices.${tier}${interval === "monthly" ? "Monthly" : "Yearly"}`;
    const priceId = this.config.get<string>(priceKey);

    if (!priceId) {
      throw new BadRequestException(`Price not configured for ${tier} ${interval}`);
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.config.get("app.appUrl")}/dashboard?subscription=success`,
      cancel_url: `${this.config.get("app.appUrl")}/settings?subscription=cancelled`,
      metadata: { velonixUserId: userId, tier },
      subscription_data: {
        metadata: { velonixUserId: userId, tier },
      },
    });

    return { url: session.url };
  }

  /** Create a Stripe Billing Portal session for managing an existing subscription */
  async createPortalSession(userId: string) {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });

    if (!user.stripeCustomerId) {
      throw new BadRequestException("No billing account found. Please subscribe first.");
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${this.config.get("app.appUrl")}/settings`,
    });

    return { url: session.url };
  }

  /** Cancel subscription immediately (downgrade to free) */
  async cancelSubscription(userId: string) {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });

    if (!user.stripeCustomerId) return;

    const subscriptions = await this.stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length > 0 && subscriptions.data[0]) {
      await this.stripe.subscriptions.cancel(subscriptions.data[0].id);
    }

    await this.userRepo.update(userId, {
      subscriptionTier: "free",
      subscriptionExpiresAt: null,
    });
  }

  /**
   * Called by the Stripe webhook handler when a subscription is
   * created, updated, or deleted.
   */
  async syncSubscriptionFromWebhook(subscription: Stripe.Subscription) {
    const userId = subscription.metadata["velonixUserId"];
    if (!userId) {
      this.logger.warn(`Subscription ${subscription.id} has no velonixUserId metadata`);
      return;
    }

    const tier = (subscription.metadata["tier"] ?? "free") as SubscriptionTier;
    const isActive = subscription.status === "active" || subscription.status === "trialing";

    await this.userRepo.update(userId, {
      subscriptionTier: isActive ? tier : "free",
      subscriptionExpiresAt: isActive
        ? new Date(subscription.current_period_end * 1000)
        : null,
    });

    this.logger.log(`Synced subscription for user ${userId}: ${tier} (${subscription.status})`);
  }
}
