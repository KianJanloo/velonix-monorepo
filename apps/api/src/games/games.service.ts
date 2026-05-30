import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GameEntity } from "./game.entity";
import { createStarterGameData } from "@velonix/game-engine";
import type { CreateGameDto, UpdateGameDto } from "@velonix/game-engine";

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(GameEntity)
    private readonly gameRepo: Repository<GameEntity>
  ) {}

  async create(creatorId: string, dto: CreateGameDto) {
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
    if (!game) throw new NotFoundException("Game not found");
    return game;
  }

  async update(id: string, creatorId: string, dto: UpdateGameDto) {
    const game = await this.findOne(id);
    if (game.creatorId !== creatorId) throw new ForbiddenException();
    Object.assign(game, dto);
    return this.gameRepo.save(game);
  }

  async publish(id: string, creatorId: string) {
    const game = await this.findOne(id);
    if (game.creatorId !== creatorId) throw new ForbiddenException();
    game.status = "reviewing";
    return this.gameRepo.save(game);
  }

  async remove(id: string, creatorId: string) {
    const game = await this.findOne(id);
    if (game.creatorId !== creatorId) throw new ForbiddenException();
    await this.gameRepo.remove(game);
  }
}
