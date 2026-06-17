import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FollowEntity } from "../entities/follow.entity";
import { UsersService } from "./users.service";
import { NotificationsService } from "../../notifications/notifications.service";

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(FollowEntity)
    private readonly followRepo: Repository<FollowEntity>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async follow(followerId: string, targetUsername: string) {
    const target = await this.usersService.findByUsername(targetUsername);
    if (target.id === followerId) {
      throw new BadRequestException("You can't follow yourself.");
    }
    const existing = await this.followRepo.findOne({
      where: { followerId, followingId: target.id },
    });
    if (!existing) {
      await this.followRepo.save(
        this.followRepo.create({ followerId, followingId: target.id }),
      );

      const follower = await this.usersService.findById(followerId);
      await this.notificationsService.create({
        userId: target.id,
        type: "new_follower",
        title: "New follower",
        body: `${follower.displayName || follower.username} started following you.`,
        linkUrl: `/profile/${follower.username}`,
      });
    }
    return this.getStatus(followerId, targetUsername);
  }

  async unfollow(followerId: string, targetUsername: string) {
    const target = await this.usersService.findByUsername(targetUsername);
    await this.followRepo.delete({ followerId, followingId: target.id });
    return this.getStatus(followerId, targetUsername);
  }

  async getStatus(followerId: string | null, targetUsername: string) {
    const target = await this.usersService.findByUsername(targetUsername);
    const [followersCount, followingCount, isFollowing] = await Promise.all([
      this.followRepo.count({ where: { followingId: target.id } }),
      this.followRepo.count({ where: { followerId: target.id } }),
      followerId
        ? this.followRepo.exists({
            where: { followerId, followingId: target.id },
          })
        : Promise.resolve(false),
    ]);
    return { isFollowing, followersCount, followingCount };
  }

  async listFollowers(targetUsername: string, page = 1, perPage = 30) {
    const target = await this.usersService.findByUsername(targetUsername);
    const [rows, total] = await this.followRepo.findAndCount({
      where: { followingId: target.id },
      order: { createdAt: "DESC" },
      take: perPage,
      skip: (page - 1) * perPage,
    });
    const users = await Promise.all(
      rows.map((r) => this.usersService.findById(r.followerId)),
    );
    return {
      data: users.map((u: any) => u.toPublicProfile()),
      total,
      page,
      perPage,
    };
  }

  async listFollowing(targetUsername: string, page = 1, perPage = 30) {
    const target = await this.usersService.findByUsername(targetUsername);
    const [rows, total] = await this.followRepo.findAndCount({
      where: { followerId: target.id },
      order: { createdAt: "DESC" },
      take: perPage,
      skip: (page - 1) * perPage,
    });
    const users = await Promise.all(
      rows.map((r) => this.usersService.findById(r.followingId)),
    );
    return {
      data: users.map((u: any) => u.toPublicProfile()),
      total,
      page,
      perPage,
    };
  }
}
