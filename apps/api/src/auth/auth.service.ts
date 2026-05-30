import { Injectable, UnauthorizedException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { UserEntity } from "../users/user.entity";
import type { RegisterDto, LoginDto } from "@velonix/game-engine";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userRepo.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });
    if (exists) {
      throw new ConflictException(
        exists.email === dto.email
          ? "An account with this email already exists."
          : "This username is already taken."
      );
    }

    const rounds = this.config.get<number>("app.bcryptRounds") ?? 12;
    const passwordHash = await bcrypt.hash(dto.password, rounds);

    const user = this.userRepo.create({
      email: dto.email,
      username: dto.username,
      displayName: dto.displayName,
      passwordHash,
    });

    const saved = await this.userRepo.save(user);
    return this.issueTokens(saved);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        subscriptionTier: true,
        passwordHash: true,
      },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    await this.userRepo.update(user.id, { lastLoginAt: new Date() });
    return this.issueTokens(user);
  }

  private issueTokens(user: UserEntity) {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      tier: user.subscriptionTier,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: user.toPublicProfile(),
    };
  }

  async validateJwtPayload(payload: { sub: string }) {
    return this.userRepo.findOne({ where: { id: payload.sub } });
  }
}
