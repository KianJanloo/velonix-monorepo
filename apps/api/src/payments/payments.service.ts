import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { PurchaseEntity } from "../marketplace/purchase.entity";
import { GameEntity } from "../games/game.entity";
import { UserEntity } from "../users/user.entity";
import { AssetEntity } from "../assets/asset.entity";
import { AssetPurchaseEntity } from "../assets/asset-purchase.entity";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";
import { calculateCommission } from "@velonix/game-engine";

@Injectable()
export class PaymentsService {
  private _stripe?: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(PurchaseEntity)
    private readonly purchaseRepo: Repository<PurchaseEntity>,
    @InjectRepository(GameEntity)
    private readonly gameRepo: Repository<GameEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(AssetEntity)
    private readonly assetRepo: Repository<AssetEntity>,
    @InjectRepository(AssetPurchaseEntity)
    private readonly assetPurchaseRepo: Repository<AssetPurchaseEntity>,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly config: ConfigService,
  ) {}

  private get stripe(): Stripe {
    if (!this._stripe) {
      const key = this.config.get<string>("stripe.secretKey");
      if (!key) throw new BadRequestException("Stripe is not configured. Set STRIPE_SECRET_KEY.");
      this._stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia" });
    }
    return this._stripe;
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
   * Create a Stripe PaymentIntent for purchasing a marketplace component asset.
   * Revenue is shared with the asset's author (Stripe Connect when available).
   */
  async createAssetPurchaseIntent(buyerId: string, assetId: string) {
    const asset = await this.assetRepo.findOne({ where: { id: assetId }, relations: ["author"] });

    if (!asset) throw new BadRequestException("Asset not found.");
    if (!asset.isPublished) throw new BadRequestException("Asset is not available.");
    if (asset.isFree) throw new BadRequestException("This asset is free — acquire it instead.");
    if (!asset.priceUsd) throw new BadRequestException("Asset has no price set.");
    if (asset.authorId === buyerId) throw new BadRequestException("You already own this asset.");

    const alreadyOwned = await this.assetPurchaseRepo.findOne({ where: { buyerId, assetId } });
    if (alreadyOwned) throw new BadRequestException("You already own this asset.");

    const authorConnectId = asset.author?.stripeConnectAccountId;
    const authorTier = asset.author?.subscriptionTier ?? "free";
    const { platformFee } = calculateCommission(asset.priceUsd, authorTier);

    const intentParams: Stripe.PaymentIntentCreateParams = {
      amount: asset.priceUsd,
      currency: "usd",
      metadata: {
        velonixBuyerId: buyerId,
        velonixAssetId: assetId,
        velonixAuthorId: asset.authorId,
      },
    };
    if (authorConnectId) {
      intentParams.application_fee_amount = platformFee;
      intentParams.transfer_data = { destination: authorConnectId };
    }

    const intent = await this.stripe.paymentIntents.create(intentParams);

    return {
      clientSecret: intent.client_secret,
      amount: asset.priceUsd,
      platformFee,
      creatorEarnings: asset.priceUsd - platformFee,
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
    const { velonixBuyerId, velonixGameId, velonixCreatorId, velonixAssetId } = intent.metadata;

    // Component-asset purchase takes a separate path.
    if (velonixBuyerId && velonixAssetId) {
      await this.handleAssetPaymentSucceeded(intent);
      return;
    }

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

  private async handleAssetPaymentSucceeded(intent: Stripe.PaymentIntent) {
    const { velonixBuyerId, velonixAssetId, velonixAuthorId } = intent.metadata;
    if (!velonixBuyerId || !velonixAssetId) return;

    const asset = await this.assetRepo.findOne({ where: { id: velonixAssetId }, relations: ["author"] });
    if (!asset) return;

    const authorTier = asset.author?.subscriptionTier ?? "free";
    const { platformFee, creatorEarnings } = calculateCommission(intent.amount, authorTier);

    const existing = await this.assetPurchaseRepo.findOne({
      where: { buyerId: velonixBuyerId, assetId: velonixAssetId },
    });
    if (!existing) {
      await this.assetPurchaseRepo.save(
        this.assetPurchaseRepo.create({
          buyerId: velonixBuyerId,
          assetId: velonixAssetId,
          amountPaidUsd: intent.amount,
          platformFeeUsd: platformFee,
          creatorEarningsUsd: creatorEarnings,
          stripePaymentIntentId: intent.id,
        }),
      );
      await this.assetRepo.increment({ id: velonixAssetId }, "totalPurchases", 1);
    }

    if (velonixAuthorId) {
      await this.userRepo.increment({ id: velonixAuthorId }, "totalEarnings", creatorEarnings);
      await this.userRepo.increment({ id: velonixAuthorId }, "totalSales", 1);
    }

    this.logger.log(
      `Asset purchase recorded: asset=${velonixAssetId} buyer=${velonixBuyerId} amount=${intent.amount}`,
    );
  }
}
