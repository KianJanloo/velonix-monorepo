import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GameEntity } from "./game.entity";
import { UserEntity } from "../users/user.entity";
import { createStarterGameData } from "@velonix/game-engine";
import { SUBSCRIPTION_LIMITS } from "@velonix/types";
import type { SubscriptionTier } from "@velonix/types";
import type { CreateGameDto, UpdateGameDto } from "@velonix/game-engine";

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(GameEntity)
    private readonly gameRepo: Repository<GameEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
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
    return this.gameRepo.find({
      where: { creatorId },
      order: { updatedAt: "DESC" },
    });
  }

  async findOne(id: string) {
    const game = await this.gameRepo.findOne({ where: { id }, relations: ["creator"] });
    if (!game) throw new NotFoundException("Game not found.");
    return game;
  }

  async update(id: string, creatorId: string, dto: UpdateGameDto) {
    const game = await this.findOne(id);
    if (game.creatorId !== creatorId) throw new ForbiddenException("You don't own this game.");
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

  async remove(id: string, creatorId: string) {
    const game = await this.findOne(id);
    if (game.creatorId !== creatorId) throw new ForbiddenException("You don't own this game.");
    await this.gameRepo.remove(game);
  }
}
