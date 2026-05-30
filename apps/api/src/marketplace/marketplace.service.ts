import {
  Injectable, NotFoundException, ForbiddenException, ConflictException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindManyOptions, ILike, In } from "typeorm";
import { GameEntity } from "../games/game.entity";
import { ReviewEntity } from "./review.entity";
import { PurchaseEntity } from "./purchase.entity";
import { calculateCommission } from "@velonix/game-engine";
import type { MarketplaceFiltersDto, CreateReviewDto } from "@velonix/game-engine";
import type { SubscriptionTier } from "@velonix/types";

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectRepository(GameEntity)
    private readonly gameRepo: Repository<GameEntity>,
    @InjectRepository(ReviewEntity)
    private readonly reviewRepo: Repository<ReviewEntity>,
    @InjectRepository(PurchaseEntity)
    private readonly purchaseRepo: Repository<PurchaseEntity>
  ) {}

  // ── Listings ───────────────────────────────────────────────────────────────

  async findListings(filters: MarketplaceFiltersDto) {
    const {
      category, isFree, priceMin, priceMax, complexity,
      search, sort, page, perPage, minRating
    } = filters;

    const where: FindManyOptions<GameEntity>["where"] = { status: "published" };

    if (category) Object.assign(where, { category });
    if (typeof isFree === "boolean") Object.assign(where, { isFree });
    if (complexity) Object.assign(where, { complexity });
    if (search) Object.assign(where, { title: ILike(`%${search}%`) });

    const orderMap: Record<string, object> = {
      newest: { publishedAt: "DESC" },
      popular: { totalViews: "DESC" },
      top_rated: { averageRating: "DESC" },
      price_asc: { priceUsd: "ASC" },
      price_desc: { priceUsd: "DESC" },
      most_sold: { totalPurchases: "DESC" },
    };

    const [data, total] = await this.gameRepo.findAndCount({
      where,
      order: orderMap[sort] ?? { publishedAt: "DESC" },
      take: perPage,
      skip: (page - 1) * perPage,
      relations: ["creator"],
    });

    return {
      data: data.map((g) => g.toSummary()),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
      hasNextPage: page * perPage < total,
      hasPreviousPage: page > 1,
    };
  }

  async findFeatured(limit = 6) {
    return this.gameRepo.find({
      where: { status: "published" },
      order: { totalPurchases: "DESC", averageRating: "DESC" },
      take: limit,
      relations: ["creator"],
    });
  }

  // ── Reviews ────────────────────────────────────────────────────────────────

  async getReviews(gameId: string) {
    return this.reviewRepo.find({
      where: { gameId },
      order: { createdAt: "DESC" },
      relations: ["author"],
      take: 50,
    });
  }

  async createReview(authorId: string, dto: CreateReviewDto) {
    const existing = await this.reviewRepo.findOne({
      where: { gameId: dto.gameId, authorId },
    });
    if (existing) throw new ConflictException("You have already reviewed this game.");

    const isVerified = await this.purchaseRepo.findOne({
      where: { gameId: dto.gameId, buyerId: authorId },
    });

    const review = this.reviewRepo.create({
      gameId: dto.gameId,
      title: dto.title,
      body: dto.body,
      rating: dto.rating as 1 | 2 | 3 | 4 | 5,
      authorId,
      isVerifiedPurchase: !!isVerified,
    });

    const saved = await this.reviewRepo.save(review);

    // Recalculate game rating
    await this.recalculateRating(dto.gameId);
    return saved;
  }

  private async recalculateRating(gameId: string) {
    const result = await this.reviewRepo
      .createQueryBuilder("r")
      .select("AVG(r.rating)", "avg")
      .addSelect("COUNT(*)", "count")
      .where("r.gameId = :gameId", { gameId })
      .getRawOne<{ avg: string; count: string }>();

    await this.gameRepo.update(gameId, {
      averageRating: result ? parseFloat(result.avg) : null,
      totalRatings: result ? parseInt(result.count, 10) : 0,
    });
  }

  // ── Purchases ──────────────────────────────────────────────────────────────

  async checkOwnership(buyerId: string, gameId: string) {
    return this.purchaseRepo.findOne({ where: { buyerId, gameId } });
  }

  async getLibrary(buyerId: string) {
    const purchases = await this.purchaseRepo.find({
      where: { buyerId },
      relations: ["game"],
      order: { createdAt: "DESC" },
    });
    return purchases.map((p) => p.game.toSummary());
  }

  async recordPurchase(params: {
    buyerId: string;
    gameId: string;
    amountPaidUsd: number;
    creatorTier: SubscriptionTier;
    stripePaymentIntentId: string;
  }) {
    const existing = await this.checkOwnership(params.buyerId, params.gameId);
    if (existing) throw new ConflictException("Game already purchased.");

    const { platformFee, creatorEarnings } = calculateCommission(
      params.amountPaidUsd,
      params.creatorTier
    );

    const purchase = this.purchaseRepo.create({
      buyerId: params.buyerId,
      gameId: params.gameId,
      amountPaidUsd: params.amountPaidUsd,
      platformFeeUsd: platformFee,
      creatorEarningsUsd: creatorEarnings,
      stripePaymentIntentId: params.stripePaymentIntentId,
    });

    await this.purchaseRepo.save(purchase);

    // Increment game purchase counter
    await this.gameRepo.increment({ id: params.gameId }, "totalPurchases", 1);

    return purchase;
  }
}
