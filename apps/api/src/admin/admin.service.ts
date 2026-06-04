import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like, In } from "typeorm";
import { UserEntity } from "../users/user.entity";
import { GameEntity } from "../games/game.entity";
import { PurchaseEntity } from "../marketplace/purchase.entity";
import { AssetPurchaseEntity } from "../assets/asset-purchase.entity";
import { AssetEntity } from "../assets/asset.entity";
import { NotificationsService } from "../notifications/notifications.service";
import type { UserRole, GameStatus, SubscriptionTier } from "@velonix/types/src";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(GameEntity)
    private readonly gameRepo: Repository<GameEntity>,
    @InjectRepository(PurchaseEntity)
    private readonly purchaseRepo: Repository<PurchaseEntity>,
    @InjectRepository(AssetPurchaseEntity)
    private readonly assetPurchaseRepo: Repository<AssetPurchaseEntity>,
    @InjectRepository(AssetEntity)
    private readonly assetRepo: Repository<AssetEntity>,
    private readonly notifications: NotificationsService,
  ) {}

  // ── Statistics ────────────────────────────────────────────────────────────

  async getStats() {
    const [totalUsers, totalGames, publishedGames, reviewingGames] = await Promise.all([
      this.userRepo.count(),
      this.gameRepo.count(),
      this.gameRepo.count({ where: { status: "published" } }),
      this.gameRepo.count({ where: { status: "reviewing" } }),
    ]);

    const recentUsers = await this.userRepo.find({
      order: { createdAt: "DESC" },
      take: 5,
      select: { id: true, username: true, displayName: true, email: true, role: true, createdAt: true },
    });

    const recentGames = await this.gameRepo.find({
      order: { createdAt: "DESC" },
      take: 5,
      relations: ["creator"],
    });

    return {
      users: { total: totalUsers },
      games: { total: totalGames, published: publishedGames, pendingReview: reviewingGames },
      recentUsers: recentUsers.map(u => ({
        id: u.id, username: u.username, displayName: u.displayName,
        email: u.email, role: u.role, createdAt: u.createdAt,
      })),
      recentGames: recentGames.map(g => ({
        id: g.id, title: g.title, status: g.status,
        creator: { username: g.creator?.username, displayName: g.creator?.displayName },
        createdAt: g.createdAt,
      })),
    };
  }

  // ── Users ─────────────────────────────────────────────────────────────────

  async listUsers(page = 1, perPage = 20, search?: string) {
    const where = search ? [
      { username: Like(`%${search}%`) },
      { email: Like(`%${search}%`) },
      { displayName: Like(`%${search}%`) },
    ] : {};

    const [users, total] = await this.userRepo.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true, username: true, displayName: true, email: true,
        role: true, subscriptionTier: true, isEmailVerified: true,
        totalSales: true, lastLoginAt: true, createdAt: true,
      },
    });

    return { data: users, total, page, perPage, totalPages: Math.ceil(total / perPage) };
  }

  async getUser(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      select: {
        id: true, username: true, displayName: true, email: true,
        role: true, subscriptionTier: true, isEmailVerified: true,
        totalSales: true, totalEarnings: true, lastLoginAt: true, createdAt: true,
      },
    });
    if (!user) throw new NotFoundException("User not found.");
    return user;
  }

  async updateUserRole(id: string, role: UserRole) {
    await this.userRepo.update(id, { role });
    return this.getUser(id);
  }

  async deleteUser(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException("User not found.");
    await this.userRepo.remove(user);
    return { message: "User deleted." };
  }

  // ── Games ─────────────────────────────────────────────────────────────────

  async listGames(page = 1, perPage = 20, status?: GameStatus, search?: string) {
    const where: Record<string, unknown> = {};
    if (status) where["status"] = status;
    if (search) where["title"] = Like(`%${search}%`);

    const [games, total] = await this.gameRepo.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (page - 1) * perPage,
      take: perPage,
      relations: ["creator"],
    });

    return {
      data: games.map(g => ({
        id: g.id, title: g.title, status: g.status, category: g.category,
        isFree: g.isFree, priceUsd: g.priceUsd, totalPurchases: g.totalPurchases,
        averageRating: g.averageRating, totalRatings: g.totalRatings,
        creator: { id: g.creatorId, username: g.creator?.username },
        createdAt: g.createdAt, updatedAt: g.updatedAt,
      })),
      total, page, perPage, totalPages: Math.ceil(total / perPage),
    };
  }

  async approveGame(id: string) {
    const game = await this.gameRepo.findOne({ where: { id } });
    if (!game) throw new NotFoundException("Game not found.");
    game.status = "published";
    game.publishedAt = new Date();
    const saved = await this.gameRepo.save(game);
    await this.notifications.create({
      userId: game.creatorId,
      type: "game_approved",
      title: "Your game is live! 🎉",
      body: `"${game.title}" has been approved and is now published on the marketplace.`,
      linkUrl: `/marketplace/${game.id}`,
    });
    return saved;
  }

  async rejectGame(id: string, reason: string) {
    const game = await this.gameRepo.findOne({ where: { id } });
    if (!game) throw new NotFoundException("Game not found.");
    game.status = "rejected";
    game.rejectionReason = reason;
    const saved = await this.gameRepo.save(game);
    await this.notifications.create({
      userId: game.creatorId,
      type: "game_rejected",
      title: "Game submission needs changes",
      body: `"${game.title}" was not approved. Reason: ${reason}`,
      linkUrl: `/studio/${game.id}`,
    });
    return saved;
  }

  async deleteGame(id: string) {
    const game = await this.gameRepo.findOne({ where: { id } });
    if (!game) throw new NotFoundException("Game not found.");
    await this.gameRepo.remove(game);
    return { message: "Game deleted." };
  }

  // ── Payments ──────────────────────────────────────────────────────────────

  /** Aggregate revenue across game + asset purchases (all amounts in USD cents). */
  async getPaymentStats() {
    const sumOf = async (
      repo: Repository<PurchaseEntity | AssetPurchaseEntity>,
      alias: string,
    ) => {
      const row = await repo
        .createQueryBuilder(alias)
        .select(`COALESCE(SUM(${alias}.amount_paid_usd), 0)`, "gross")
        .addSelect(`COALESCE(SUM(${alias}.platform_fee_usd), 0)`, "fees")
        .addSelect(`COALESCE(SUM(${alias}.creator_earnings_usd), 0)`, "earnings")
        .addSelect(`COUNT(*)`, "count")
        .getRawOne<{ gross: string; fees: string; earnings: string; count: string }>();
      return {
        gross: Number(row?.gross ?? 0),
        fees: Number(row?.fees ?? 0),
        earnings: Number(row?.earnings ?? 0),
        count: Number(row?.count ?? 0),
      };
    };

    const [games, assets] = await Promise.all([
      sumOf(this.purchaseRepo, "p"),
      sumOf(this.assetPurchaseRepo, "ap"),
    ]);

    return {
      grossRevenue: games.gross + assets.gross,
      platformRevenue: games.fees + assets.fees,
      creatorEarnings: games.earnings + assets.earnings,
      transactionCount: games.count + assets.count,
      byType: {
        game: { gross: games.gross, fees: games.fees, count: games.count },
        asset: { gross: assets.gross, fees: assets.fees, count: assets.count },
      },
    };
  }

  /**
   * Paginated, unified transaction feed across game and asset purchases.
   * `type` filters to one source; otherwise both are merged and sorted by date.
   */
  async listTransactions(page = 1, perPage = 20, type?: "game" | "asset") {
    type Tx = {
      id: string; type: "game" | "asset";
      buyer: { id: string; username: string } | null;
      item: { id: string; title: string } | null;
      amountPaidUsd: number; platformFeeUsd: number; creatorEarningsUsd: number;
      stripePaymentIntentId: string | null; createdAt: Date;
    };

    const games: Tx[] = type === "asset" ? [] : (
      await this.purchaseRepo.find({ relations: ["buyer", "game"], order: { createdAt: "DESC" } })
    ).map(p => ({
      id: p.id, type: "game",
      buyer: p.buyer ? { id: p.buyer.id, username: p.buyer.username } : null,
      item: p.game ? { id: p.game.id, title: p.game.title } : null,
      amountPaidUsd: p.amountPaidUsd, platformFeeUsd: p.platformFeeUsd,
      creatorEarningsUsd: p.creatorEarningsUsd,
      stripePaymentIntentId: p.stripePaymentIntentId, createdAt: p.createdAt,
    }));

    const assets: Tx[] = type === "game" ? [] : (
      await this.assetPurchaseRepo.find({ relations: ["buyer", "asset"], order: { createdAt: "DESC" } })
    ).map(a => ({
      id: a.id, type: "asset",
      buyer: a.buyer ? { id: a.buyer.id, username: a.buyer.username } : null,
      item: a.asset ? { id: a.asset.id, title: a.asset.title } : null,
      amountPaidUsd: a.amountPaidUsd, platformFeeUsd: a.platformFeeUsd,
      creatorEarningsUsd: a.creatorEarningsUsd,
      stripePaymentIntentId: a.stripePaymentIntentId, createdAt: a.createdAt,
    }));

    const all = [...games, ...assets].sort(
      (x, y) => y.createdAt.getTime() - x.createdAt.getTime(),
    );
    const total = all.length;
    const data = all.slice((page - 1) * perPage, page * perPage);

    return { data, total, page, perPage, totalPages: Math.max(1, Math.ceil(total / perPage)) };
  }

  // ── Subscriptions ─────────────────────────────────────────────────────────

  /** Subscriber counts per tier + active paid subscriptions. */
  async getSubscriptionStats() {
    const tiers: SubscriptionTier[] = ["free", "creator", "pro", "studio"];
    const counts = await Promise.all(
      tiers.map(t => this.userRepo.count({ where: { subscriptionTier: t } })),
    );
    const byTier = Object.fromEntries(tiers.map((t, i) => [t, counts[i]])) as Record<SubscriptionTier, number>;
    const paidSubscribers = byTier.creator + byTier.pro + byTier.studio;
    return { byTier, paidSubscribers, totalUsers: counts.reduce((a, b) => a + b, 0) };
  }

  /** Paid subscribers (optionally filtered to one tier), newest first. */
  async listSubscribers(page = 1, perPage = 20, tier?: SubscriptionTier) {
    const where = tier
      ? { subscriptionTier: tier }
      : { subscriptionTier: In(["creator", "pro", "studio"] as SubscriptionTier[]) };

    const [users, total] = await this.userRepo.findAndCount({
      where,
      order: { subscriptionExpiresAt: "DESC" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true, username: true, displayName: true, email: true,
        subscriptionTier: true, subscriptionExpiresAt: true,
        stripeCustomerId: true, createdAt: true,
      },
    });

    return {
      data: users.map(u => ({
        id: u.id, username: u.username, displayName: u.displayName, email: u.email,
        subscriptionTier: u.subscriptionTier,
        subscriptionExpiresAt: u.subscriptionExpiresAt,
        hasBilling: !!u.stripeCustomerId,
        createdAt: u.createdAt,
      })),
      total, page, perPage, totalPages: Math.max(1, Math.ceil(total / perPage)),
    };
  }

  // ── Marketplace assets ──────────────────────────────────────────────────────

  async listAssets(page = 1, perPage = 20, search?: string) {
    const where = search ? { title: Like(`%${search}%`) } : {};
    const [assets, total] = await this.assetRepo.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (page - 1) * perPage,
      take: perPage,
      relations: ["author"],
    });

    return {
      data: assets.map(a => ({
        id: a.id, title: a.title, kind: a.kind,
        isFree: a.isFree, priceUsd: a.priceUsd, isPublished: a.isPublished,
        componentCount: a.componentCount, totalPurchases: a.totalPurchases,
        averageRating: a.averageRating,
        author: { id: a.authorId, username: a.author?.username },
        createdAt: a.createdAt,
      })),
      total, page, perPage, totalPages: Math.max(1, Math.ceil(total / perPage)),
    };
  }

  async setAssetPublished(id: string, isPublished: boolean) {
    const asset = await this.assetRepo.findOne({ where: { id } });
    if (!asset) throw new NotFoundException("Asset not found.");
    asset.isPublished = isPublished;
    return this.assetRepo.save(asset);
  }

  async deleteAsset(id: string) {
    const asset = await this.assetRepo.findOne({ where: { id } });
    if (!asset) throw new NotFoundException("Asset not found.");
    await this.assetRepo.remove(asset);
    return { message: "Asset deleted." };
  }
}
