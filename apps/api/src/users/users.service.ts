import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "./user.entity";
import type { UpdateProfileDto } from "@velonix/game-engine";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>
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
    await this.userRepo.update(userId, dto);
    return this.findById(userId);
  }

  async getPublicProfile(username: string) {
    const user = await this.findByUsername(username);
    return user.toPublicProfile();
  }
}
