import { Controller, Post, Body, HttpCode, HttpStatus, Version } from "@nestjs/common";
import {
  ApiTags, ApiOperation, ApiBody, ApiResponse, ApiProperty,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { RegisterSchema, LoginSchema, type RegisterDto, type LoginDto } from "@velonix/game-engine";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

// ── Swagger DTO shapes ────────────────────────────────────────────────────────

class RegisterBodyDto {
  @ApiProperty({ example: "alice" })
  username!: string;

  @ApiProperty({ example: "alice@example.com" })
  email!: string;

  @ApiProperty({ example: "S3cur3P@ssword!", minLength: 8 })
  password!: string;

  @ApiProperty({ example: "Alice Builder", required: false })
  displayName?: string;
}

class LoginBodyDto {
  @ApiProperty({ example: "alice@example.com" })
  email!: string;

  @ApiProperty({ example: "S3cur3P@ssword!" })
  password!: string;
}

class AuthUserDto {
  @ApiProperty() id!: string;
  @ApiProperty() username!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty({ nullable: true }) avatarUrl!: string | null;
  @ApiProperty() subscriptionTier!: string;
  @ApiProperty() createdAt!: string;
}

class AuthResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}

// ── Controller ────────────────────────────────────────────────────────────────

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @Version("1")
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Sign in with email and password" })
  @ApiBody({ type: LoginBodyDto })
  @ApiResponse({ status: 200, description: "Login successful", type: AuthResponseDto })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  login(@Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto) {
    return this.authService.login(dto);
  }
}
