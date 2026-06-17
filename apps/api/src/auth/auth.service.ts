import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { UserEntity } from "../users/entities/user.entity";
import { SettingsService } from "../settings/settings.service";
import type {
  RegisterDto,
  LoginDto,
  ForgetPassDto,
  ResetPassDto,
  RegisterCompleteDto,
} from "@velonix/game-engine";
import { MailService } from "../mail/mail.service";

interface JwtPayload {
  sub: string;
  email: string;
  username: string;
  role: string;
  tier: string;
}

export interface GoogleProfile {
  email: string;
  displayName: string;
  avatarUrl?: string;
  googleId: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly settings: SettingsService,
    private readonly mailService: MailService,
  ) {}

  // ── Registration / Login ────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    if (!(await this.settings.signupsEnabled())) {
      throw new ForbiddenException(
        "New account registration is currently disabled.",
      );
    }

    const exists = await this.userRepo.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });
    if (exists && !exists.isEmailVerified) {
      await this.userRepo.delete(exists.id);
    }
    if (exists && exists.isEmailVerified) {
      throw new ConflictException(
        exists.email === dto.email
          ? "An account with this email already exists."
          : "This username is already taken.",
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

    const code = this.generateCode();
    const token = this.generateToken();

    user.emailVerificationCodeHash = await bcrypt.hash(code, rounds);
    user.emailVerificationTokenHash = await bcrypt.hash(token, rounds);
    user.emailVerificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.userRepo.save(user);

    await this.mailService.sendPasswordReset({
      to: user.email,
      code,
      expiresInMinutes: 15,
    });

    return {
      message:
        "Account created. Please check your email for a verification code.",
      token,
    };
  }

  async completeRegister(dto: RegisterCompleteDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      select: {
        emailVerificationCodeHash: true,
        emailVerificationTokenHash: true,
        emailVerificationExpiresAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (
      !user.emailVerificationExpiresAt ||
      user.emailVerificationExpiresAt < new Date()
    ) {
      throw new BadRequestException("Verification code has expired");
    }

    const isCodeValid = await bcrypt.compare(
      dto.code,
      user.emailVerificationCodeHash ?? "",
    );
    if (!isCodeValid) {
      throw new BadRequestException("Invalid verification code");
    }

    const isTokenValid = await bcrypt.compare(
      dto.token,
      user.emailVerificationTokenHash ?? "",
    );
    if (!isTokenValid) {
      throw new UnauthorizedException("Invalid verification token");
    }

    user.isEmailVerified = true;
    user.emailVerificationCodeHash = null;
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpiresAt = null;
    const saved = await this.userRepo.save(user);

    await this.mailService.sendWelcome({
      to: saved.email,
      displayName: saved.displayName ?? saved.username,
    });

    return this.issueTokens(saved);
  }

  async login(dto: LoginDto & { turnstileToken: string | null }) {
    if (dto.turnstileToken) await this.verifyTurnstile(dto.turnstileToken);
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        subscriptionTier: true,
        totalSales: true,
        createdAt: true,
        passwordHash: true,
      },
    });

    if (
      !user ||
      !user.passwordHash ||
      !(await bcrypt.compare(dto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    await this.userRepo.update(user.id, { lastLoginAt: new Date() });
    return this.issueTokens(user);
  }

  async verifyTurnstile(token: string): Promise<void> {
    const res = (await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY ?? "",
          response: token,
        }),
      },
    )) as any;
    const { success } = await res.json();
    if (!success) throw new UnauthorizedException("Bot check failed.");
  }

  // ── Forget Password ───────────────────────────────────────────────────────

  async forgetPass(dto: ForgetPassDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        passwordResetCodeHash: true,
        passwordResetTokenHash: true,
        passwordResetExpiresAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const code = this.generateCode();
    const token = this.generateToken();
    const rounds = this.config.get<number>("app.bcryptRounds") ?? 12;

    user.passwordResetTokenHash = await bcrypt.hash(token, rounds);
    user.passwordResetCodeHash = await bcrypt.hash(code, rounds);
    user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.mailService.sendPasswordReset({
      to: user.email,
      code,
      expiresInMinutes: 15,
    });

    await this.userRepo.save(user);

    return {
      message: "Verification code sent to your email",
      token,
    };
  }

  // ── Reset Password ────────────────────────────────────────────────────────

  async resetPass(dto: ResetPassDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        passwordResetCodeHash: true,
        passwordResetTokenHash: true,
        passwordResetExpiresAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt < new Date()
    ) {
      throw new BadRequestException("Reset code has expired");
    }

    const isCodeValid = await bcrypt.compare(
      dto.code,
      user.passwordResetCodeHash ?? "",
    );
    if (!isCodeValid) {
      throw new BadRequestException("Invalid reset code");
    }

    const isTokenValid = await bcrypt.compare(
      dto.token,
      user.passwordResetTokenHash ?? "",
    );
    if (!isTokenValid) {
      throw new UnauthorizedException("Invalid reset token");
    }

    const rounds = this.config.get<number>("app.bcryptRounds") ?? 12;
    user.passwordHash = await bcrypt.hash(dto.newPassword, rounds);

    // Clear reset fields
    user.passwordResetCodeHash = null;
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;

    await this.userRepo.save(user);

    return { message: "Password has been reset successfully" };
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────

  /** Find or create a user from a verified Google profile, then issue tokens. */
  async validateGoogleUser(profile: GoogleProfile) {
    let user = await this.userRepo.findOne({ where: { email: profile.email } });

    if (!user) {
      const base =
        profile.email
          .split("@")[0]!
          .replace(/[^a-z0-9_-]/gi, "")
          .toLowerCase()
          .slice(0, 24) || "user";
      let username = base;
      let n = 0;
      while (await this.userRepo.findOne({ where: { username } })) {
        n += 1;
        username = `${base}${n}`;
      }

      user = this.userRepo.create({
        email: profile.email,
        username,
        displayName: profile.displayName || base,
        avatarUrl: profile.avatarUrl ?? null,
        // OAuth users have no usable local password
        passwordHash: await bcrypt.hash(
          `oauth:${profile.googleId}:${Date.now()}`,
          10,
        ),
        isEmailVerified: true,
      });
      user = await this.userRepo.save(user);
    } else if (!user.avatarUrl && profile.avatarUrl) {
      user.avatarUrl = profile.avatarUrl;
      await this.userRepo.save(user);
    }

    await this.userRepo.update(user.id, { lastLoginAt: new Date() });
    return this.issueTokens(user);
  }

  // ── Refresh / Logout ────────────────────────────────────────────────────

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.config.get<string>("jwt.refreshSecret"),
      });
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token.");
    }

    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        subscriptionTier: true,
        totalSales: true,
        createdAt: true,
        refreshTokenHash: true,
      },
    });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException("Session expired. Please sign in again.");
    }

    const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!valid) {
      // Possible token reuse — revoke the session
      await this.userRepo.update(user.id, { refreshTokenHash: null });
      throw new UnauthorizedException("Session expired. Please sign in again.");
    }

    return this.issueTokens(user); // rotates the refresh token
  }

  async logout(userId: string) {
    await this.userRepo.update(userId, { refreshTokenHash: null });
    return { message: "Logged out." };
  }

  async getMe(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return user.toPublicProfile();
  }

  // ── Token issuance ────────────────────────────────────────────────────────

  private async issueTokens(user: UserEntity) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      tier: user.subscriptionTier,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>("jwt.accessSecret"),
      expiresIn: this.config.get<string>("jwt.accessExpiresIn") ?? "15m",
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>("jwt.refreshSecret"),
      expiresIn: this.config.get<string>("jwt.refreshExpiresIn") ?? "30d",
    });

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.userRepo.update(user.id, { refreshTokenHash });

    return {
      accessToken,
      refreshToken,
      user: user.toPublicProfile(),
    };
  }

  async validateJwtPayload(payload: { sub: string }) {
    return this.userRepo.findOne({ where: { id: payload.sub } });
  }

  // Generator helpers
  private generateCode(): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length: 6 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length)),
    ).join("");
  }

  private generateToken(): string {
    // Use Node crypto to produce a URL-safe-ish random token.
    // 96 bytes -> base64 length ~128 chars; slice to 128 for consistency.
    return randomBytes(96).toString("base64").slice(0, 128);
  }
}
