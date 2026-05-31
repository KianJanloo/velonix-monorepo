import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
import { UserEntity } from "../users/user.entity";
import { GameEntity } from "../games/game.entity";
import { NotificationsService } from "../notifications/notifications.service";
import type { UserRole, GameStatus } from "@velonix/types";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(GameEntity)
    private readonly gameRepo: Repository<GameEntity>,
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
}
