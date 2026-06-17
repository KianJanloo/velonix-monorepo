import { Injectable, Logger, type OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { UserEntity } from "../users/entities/user.entity";

/**
 * Ensures an administrator account exists on startup.
 * Configure via env: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_USERNAME (optional).
 * If an account with ADMIN_EMAIL already exists, it is promoted to admin.
 */
@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const email = (this.config.get<string>("admin.email") ?? "").toLowerCase().trim();
    const password = this.config.get<string>("admin.password") ?? "";
    if (!email || !password) return; // not configured — skip silently

    try {
      const desiredUsername = (this.config.get<string>("admin.username") ?? "admin").toLowerCase().trim();

      // Promote if an account already exists under this email OR username.
      const existing = await this.userRepo.findOne({
        where: [{ email }, { username: desiredUsername }],
      });
      if (existing) {
        if (existing.role !== "admin") {
          existing.role = "admin";
          await this.userRepo.save(existing);
          this.logger.log(`Promoted existing user (${existing.email}) to admin.`);
        } else {
          this.logger.log(`Admin account already present (${existing.email}).`);
        }
        return;
      }

      // Ensure a unique username
      let username = desiredUsername;
      let n = 0;
      while (await this.userRepo.findOne({ where: { username } })) {
        n += 1;
        username = `${desiredUsername}${n}`;
      }

      const rounds = this.config.get<number>("app.bcryptRounds") ?? 12;
      const admin = this.userRepo.create({
        email,
        username,
        displayName: "Velonix Admin",
        passwordHash: await bcrypt.hash(password, rounds),
        role: "admin",
        isEmailVerified: true,
        subscriptionTier: "studio",
      });
      await this.userRepo.save(admin);
      this.logger.log(`Created admin account: ${email}`);
    } catch (err) {
      this.logger.warn(`Admin seed skipped: ${(err as Error).message}`);
    }
  }
}
