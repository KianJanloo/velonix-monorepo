import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { PurchaseEntity } from "../marketplace/purchase.entity";
import { GameEntity } from "../games/game.entity";
import { UserEntity } from "../users/user.entity";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";
import { calculateCommission } from "@velonix/game-engine";

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(PurchaseEntity)
    private readonly purchaseRepo: Repository<PurchaseEntity>,
    @InjectRepository(GameEntity)
    private readonly gameRepo: Repository<GameEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly config: ConfigService,
  ) {
    const secretKey = this.config.get<string>("stripe.secretKey");

    if (!secretKey) {
      throw new Error(
        "STRIPE_SECRET_KEY is missing. Check ConfigModule envFilePath.",
      );
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: "2025-02-24.acacia",
    });
  }

  /**
   * Create a Stripe PaymentIntent for purchasing a game.
   * Uses Stripe Connect with application_fee_amount so the creator
   * is paid directly to their connected account.
   */
  async createGamePurchaseIntent(buyerId: string, gameId: string) {
    const game = await this.gameRepo.findOne({
      where: { id: gameId },
      relations: ["creator"],
    });

    if (!game) throw new BadRequestException("Game not found.");
    if (game.isFree)
      throw new BadRequestException("This game is free — no payment required.");
    if (!game.priceUsd) throw new BadRequestException("Game has no price set.");
    if (game.status !== "published")
      throw new BadRequestException("Game is not available for purchase.");

    const alreadyOwned = await this.purchaseRepo.findOne({
      where: { buyerId, gameId },
    });
    if (alreadyOwned)
      throw new BadRequestException("You already own this game.");

    const creatorConnectId = game.creator?.stripeConnectAccountId;
    const creatorTier = game.creator?.subscriptionTier ?? "free";

    const { platformFee } = calculateCommission(game.priceUsd, creatorTier);

    const intentParams: Stripe.PaymentIntentCreateParams = {
      amount: game.priceUsd,
      currency: "usd",
      metadata: {
        velonixBuyerId: buyerId,
        velonixGameId: gameId,
        velonixCreatorId: game.creatorId,
      },
    };

    // If creator has a connected account, route payment through Connect
    if (creatorConnectId) {
      intentParams.application_fee_amount = platformFee;
      intentParams.transfer_data = { destination: creatorConnectId };
    }

    const intent = await this.stripe.paymentIntents.create(intentParams);

    return {
      clientSecret: intent.client_secret,
      amount: game.priceUsd,
      platformFee,
      creatorEarnings: game.priceUsd - platformFee,
    };
  }

  /**
   * Onboard a creator to Stripe Connect (Express account).
   * Returns an account link URL to redirect the creator to.
   */
  async createConnectOnboardingLink(userId: string) {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });

    let accountId = user.stripeConnectAccountId;

    if (!accountId) {
      const account = await this.stripe.accounts.create({
        type: "express",
        email: user.email,
        metadata: { velonixUserId: userId },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;
      await this.userRepo.update(userId, { stripeConnectAccountId: accountId });
    }

    const link = await this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${this.config.get("app.appUrl")}/settings?connect=refresh`,
      return_url: `${this.config.get("app.appUrl")}/settings?connect=success`,
      type: "account_onboarding",
    });

    return { url: link.url };
  }

  /**
   * Handle all incoming Stripe webhook events.
   * Validates the Stripe-Signature header before processing.
   */
  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.config.get<string>("stripe.webhookSecret") ?? "";

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      this.logger.error("Webhook signature verification failed", err);
      throw new BadRequestException("Invalid webhook signature.");
    }

    this.logger.log(`Processing Stripe event: ${event.type}`);

    switch (event.type) {
      case "payment_intent.succeeded":
        await this.handlePaymentSucceeded(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await this.subscriptionsService.syncSubscriptionFromWebhook(
          event.data.object as Stripe.Subscription,
        );
        break;

      default:
        this.logger.debug(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handlePaymentSucceeded(intent: Stripe.PaymentIntent) {
    const { velonixBuyerId, velonixGameId, velonixCreatorId } = intent.metadata;

    if (!velonixBuyerId || !velonixGameId) {
      this.logger.warn(`PaymentIntent ${intent.id} missing metadata`);
      return;
    }

    const game = await this.gameRepo.findOne({
      where: { id: velonixGameId },
      relations: ["creator"],
    });
    if (!game) return;

    const creatorTier = game.creator?.subscriptionTier ?? "free";
    const { platformFee, creatorEarnings } = calculateCommission(
      intent.amount,
      creatorTier,
    );

    // Record the purchase
    const existing = await this.purchaseRepo.findOne({
      where: { buyerId: velonixBuyerId, gameId: velonixGameId },
    });
    if (!existing) {
      await this.purchaseRepo.save(
        this.purchaseRepo.create({
          buyerId: velonixBuyerId,
          gameId: velonixGameId,
          amountPaidUsd: intent.amount,
          platformFeeUsd: platformFee,
          creatorEarningsUsd: creatorEarnings,
          stripePaymentIntentId: intent.id,
        }),
      );
      await this.gameRepo.increment({ id: velonixGameId }, "totalPurchases", 1);
    }

    // Update creator earnings
    if (velonixCreatorId) {
      await this.userRepo.increment(
        { id: velonixCreatorId },
        "totalEarnings",
        creatorEarnings,
      );
      await this.userRepo.increment({ id: velonixCreatorId }, "totalSales", 1);
    }

    this.logger.log(
      `Purchase recorded: game=${velonixGameId} buyer=${velonixBuyerId} amount=${intent.amount}`,
    );
  }
}
