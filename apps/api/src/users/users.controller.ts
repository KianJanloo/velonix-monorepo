import { Controller, Get, Patch, Body, Param, UseGuards, Request, Version } from "@nestjs/common";
import {
  ApiTags, ApiBearerAuth, ApiOperation,
  ApiParam, ApiBody, ApiResponse, ApiProperty,
} from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { UpdateProfileSchema, type UpdateProfileDto } from "@velonix/game-engine";

// ── Swagger DTO shapes ────────────────────────────────────────────────────────

class UpdateProfileBodyDto {
  @ApiProperty({ required: false }) displayName?: string;
  @ApiProperty({ required: false, nullable: true }) bio?: string | null;
  @ApiProperty({ required: false, nullable: true }) avatarUrl?: string | null;
}

class UserDto {
  @ApiProperty() id!: string;
  @ApiProperty() username!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty({ nullable: true }) avatarUrl!: string | null;
  @ApiProperty({ nullable: true }) bio!: string | null;
  @ApiProperty() subscriptionTier!: string;
  @ApiProperty() totalSales!: number;
  @ApiProperty() createdAt!: string;
}

// ── Controller ────────────────────────────────────────────────────────────────

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Get current authenticated user" })
  @ApiResponse({ status: 200, description: "Authenticated user profile", type: UserDto })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getMe(@Request() req: { user: { id: string } }) {
    return this.usersService.findById(req.user.id);
  }

  @Patch("me")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Update current user profile" })
  @ApiBody({ type: UpdateProfileBodyDto })
  @ApiResponse({ status: 200, description: "Updated user profile", type: UserDto })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  updateMe(
    @Request() req: { user: { id: string } },
    @Body(new ZodValidationPipe(UpdateProfileSchema)) dto: UpdateProfileDto
  ) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Get(":username")
  @Version("1")
  @ApiOperation({ summary: "Get public creator profile" })
  @ApiParam({ name: "username", example: "alice" })
  @ApiResponse({ status: 200, description: "Public creator profile", type: UserDto })
  @ApiResponse({ status: 404, description: "User not found" })
  getPublicProfile(@Param("username") username: string) {
    return this.usersService.getPublicProfile(username);
  }
}
