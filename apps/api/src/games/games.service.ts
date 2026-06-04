import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { GameEntity } from "./game.entity";
import { UserEntity } from "../users/user.entity";
import { CollaboratorsService } from "./collaborators.service";
import { createStarterGameData, suggestGamePrice } from "@velonix/game-engine/src";
import { SUBSCRIPTION_LIMITS } from "@velonix/types/src";
import type { SubscriptionTier } from "@velonix/types/src";
import type { CreateGameDto, UpdateGameDto } from "@velonix/game-engine/src";

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(GameEntity)
    private readonly gameRepo: Repository<GameEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly collaborators: CollaboratorsService,
  ) {}

  async create(creatorId: string, dto: CreateGameDto) {
    // Enforce per-tier game project limits (single source of truth: SUBSCRIPTION_LIMITS)
    const user = await this.userRepo.findOne({ where: { id: creatorId } });
    const tier = (user?.subscriptionTier ?? "free") as SubscriptionTier;
    const maxProjects = SUBSCRIPTION_LIMITS[tier]?.maxProjects ?? 3;

    if (maxProjects !== null) {
      const existingCount = await this.gameRepo.count({ where: { creatorId } });
      if (existingCount >= maxProjects) {
        throw new BadRequestException(
          `Your ${tier} plan allows up to ${maxProjects} game project${maxProjects === 1 ? "" : "s"}. Upgrade your plan to create more.`
        );
      }
    }

    const game = this.gameRepo.create({
      creatorId,
      title: dto.title,
      description: dto.description,
      shortDescription: dto.shortDescription,
      category: dto.category,
      tags: dto.tags,
      playerCountMin: dto.playerCountMin,
      playerCountMax: dto.playerCountMax,
      playtimeMin: dto.playtimeMin,
      playtimeMax: dto.playtimeMax,
      complexity: dto.complexity,
      minAge: dto.minAge,
      language: dto.language,
      status: "draft",
      studioData: createStarterGameData("pending") as unknown as Record<string, unknown>,
    });

    return this.gameRepo.save(game);
  }

  async findMine(creatorId: string) {
    const owned = await this.gameRepo.find({
      where: { creatorId },
      order: { updatedAt: "DESC" },
    });
    // Also include games this user collaborates on (shared studios).
    const sharedIds = await this.collaborators.gameIdsForUser(creatorId);
    if (sharedIds.length === 0) return owned;
    const shared = await this.gameRepo.find({
      where: { id: In(sharedIds) },
      relations: ["creator"],
      order: { updatedAt: "DESC" },
    });
    return [...owned, ...shared];
  }

  async findOne(id: string) {
    const game = await this.gameRepo.findOne({ where: { id }, relations: ["creator"] });
    if (!game) throw new NotFoundException("Game not found.");
    return game;
  }

  async update(id: string, userId: string, dto: UpdateGameDto) {
    const game = await this.findOne(id);
    // Owner or an editor-collaborator may modify the design.
    if (!(await this.collaborators.canEdit(id, userId)))
      throw new ForbiddenException("You don't have edit access to this game.");
    Object.assign(game, dto);
    return this.gameRepo.save(game);
  }

  async publish(id: string, creatorId: string) {
    const game = await this.findOne(id);
    if (game.creatorId !== creatorId) throw new ForbiddenException("You don't own this game.");
    if (game.status === "reviewing") throw new BadRequestException("Game is already submitted for review.");
    if (game.status === "published") throw new BadRequestException("Game is already published.");
    game.status = "reviewing";
    return this.gameRepo.save(game);
  }

  /**
   * Smart pricing suggestion for a game, derived from its complexity and the
   * prices of similar already-published, paid games in the same category.
   */
  async getPriceSuggestion(id: string, creatorId: string) {
    const game = await this.findOne(id);
    if (game.creatorId !== creatorId) throw new ForbiddenException("You don't own this game.");

    const comparableGames = await this.gameRepo.find({
      where: { status: "published", category: game.category, isFree: false },
      select: ["id", "priceUsd", "complexity", "category"],
      take: 200,
    });

    const comparables = comparableGames
      .filter((g) => g.id !== game.id && typeof g.priceUsd === "number" && g.priceUsd > 0)
      .map((g) => ({
        priceUsd: g.priceUsd as number,
        complexity: g.complexity,
        sameCategory: g.category === game.category,
      }));

    return suggestGamePrice(game.complexity, comparables);
  }

  async remove(id: string, creatorId: string) {
    const game = await this.findOne(id);
    if (game.creatorId !== creatorId) throw new ForbiddenException("You don't own this game.");
    await this.gameRepo.remove(game);
  }
}
