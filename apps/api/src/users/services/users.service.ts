import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { UpdateProfileDto } from "@velonix/game-engine";
import { UserEntity } from "../entities/user.entity";
import { GameEntity } from "../../games/game.entity";
import { FollowEntity } from "../entities/follow.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(GameEntity)
    private readonly gameRepo: Repository<GameEntity>,
    @InjectRepository(FollowEntity)
    private readonly followRepo: Repository<FollowEntity>,
  ) {}

  async findById(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async findByUsername(username: string) {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const patch: Record<string, unknown> = {};
    if (dto.displayName !== undefined) patch["displayName"] = dto.displayName;
    if (dto.bio !== undefined) patch["bio"] = dto.bio;
    if (dto.avatarUrl !== undefined) patch["avatarUrl"] = dto.avatarUrl || null;
    if (Object.keys(patch).length > 0) {
      await this.userRepo.update(userId, patch);
    }
    return this.findById(userId);
  }

  async getPublicProfile(username: string) {
    const user = await this.findByUsername(username);
    const games = await this.gameRepo.find({
      where: { creatorId: user.id, status: "published" },
      order: { totalPurchases: "DESC" },
      take: 24,
    });

    const [followersCount, followingCount] = await Promise.all([
      this.followRepo.count({ where: { followingId: user.id } }),
      this.followRepo.count({ where: { followerId: user.id } }),
    ]);

    return {
      ...user.toPublicProfile(),
      stats: {
        publishedGames: games.length,
        totalSales: user.totalSales,
        followersCount,
        followingCount,
      },
      games: games.map((g) => g.toSummary()),
    };
  }
}
