import {
  Controller, Post, Get, Body, HttpCode, HttpStatus, Version,
  UseGuards, Request, Res,
} from "@nestjs/common";
import {
  ApiTags, ApiOperation, ApiBody, ApiResponse, ApiProperty, ApiBearerAuth, ApiExcludeEndpoint,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { ConfigService } from "@nestjs/config";

// Credential endpoints: 10 attempts per minute per IP (brute-force protection).
const AUTH_THROTTLE = { default: { limit: 10, ttl: 60_000 } };
import { AuthService, type GoogleProfile } from "./auth.service";
import { RegisterSchema, LoginSchema, type RegisterDto, type LoginDto } from "@velonix/game-engine/src";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { GoogleAuthGuard } from "./guards/google-auth.guard";

// ── Swagger DTO shapes ────────────────────────────────────────────────────────

class RegisterBodyDto {
  @ApiProperty({ example: "alice@example.com" })
  email!: string;

  @ApiProperty({ example: "alice", minLength: 3, maxLength: 32 })
  username!: string;

  @ApiProperty({ example: "Alice Builder", minLength: 2, maxLength: 64 })
  displayName!: string;

  @ApiProperty({ example: "S3cur3P@ss", minLength: 8, description: "Min 8 chars, 1 uppercase, 1 number" })
  password!: string;
}

class LoginBodyDto {
  @ApiProperty({ example: "alice@example.com" })
  email!: string;

  @ApiProperty({ example: "S3cur3P@ss" })
  password!: string;

  @ApiProperty({ required: false, default: false })
  rememberMe?: boolean;
}

class RefreshBodyDto {
  @ApiProperty({ description: "The refresh token issued at login" })
  refreshToken!: string;
}

class AuthUserDto {
  @ApiProperty() id!: string;
  @ApiProperty() username!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty({ nullable: true }) avatarUrl!: string | null;
  @ApiProperty({ nullable: true }) bio!: string | null;
  @ApiProperty({ enum: ["user", "creator", "admin"] }) role!: string;
  @ApiProperty() subscriptionTier!: string;
  @ApiProperty() totalSales!: number;
  @ApiProperty() createdAt!: string;
}

class AuthResponseDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty() refreshToken!: string;
  @ApiProperty({ type: AuthUserDto }) user!: AuthUserDto;
}

// Minimal Express response shape (avoids @types/express v5 friction)
interface RedirectResponse {
  redirect(url: string): void;
}

// ── Controller ────────────────────────────────────────────────────────────────

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post("register")
  @Version("1")
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: "Register a new user account" })
  @ApiBody({ type: RegisterBodyDto })
  @ApiResponse({ status: 201, description: "Account created", type: AuthResponseDto })
  @ApiResponse({ status: 409, description: "Email or username already in use" })
  @ApiResponse({ status: 400, description: "Validation error" })
  register(@Body(new ZodValidationPipe(RegisterSchema)) dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  @Version("1")
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Sign in with email and password" })
  @ApiBody({ type: LoginBodyDto })
  @ApiResponse({ status: 200, description: "Login successful", type: AuthResponseDto })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  login(@Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("refresh")
  @Version("1")
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Exchange a refresh token for a new access + refresh token pair" })
  @ApiBody({ type: RefreshBodyDto })
  @ApiResponse({ status: 200, description: "New token pair", type: AuthResponseDto })
  @ApiResponse({ status: 401, description: "Invalid or expired refresh token" })
  refresh(@Body() body: RefreshBodyDto) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post("logout")
  @Version("1")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Log out — revokes the current refresh token" })
  @ApiResponse({ status: 200, description: "Logged out" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  logout(@Request() req: { user: { id: string } }) {
    return this.authService.logout(req.user.id);
  }

  @Get("me")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Get the currently authenticated user" })
  @ApiResponse({ status: 200, description: "Current user", type: AuthUserDto })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  me(@Request() req: { user: { id: string } }) {
    return this.authService.getMe(req.user.id);
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────

  @Get("google")
  @Version("1")
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: "Begin Google OAuth sign-in (redirects to Google)" })
  @ApiResponse({ status: 302, description: "Redirect to Google consent screen" })
  @ApiResponse({ status: 503, description: "Google sign-in not configured" })
  googleAuth() {
    // Guard redirects to Google; this handler body never executes.
  }

  @Get("google/callback")
  @Version("1")
  @UseGuards(GoogleAuthGuard)
  @ApiExcludeEndpoint()
  async googleCallback(
    @Request() req: { user: GoogleProfile },
    @Res() res: RedirectResponse,
  ) {
    const tokens = await this.authService.validateGoogleUser(req.user);
    const webUrl = this.config.get<string>("oauth.webAppUrl") ?? "http://localhost:3000";
    const params = new URLSearchParams({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
    res.redirect(`${webUrl}/auth/callback#${params.toString()}`);
  }
}
