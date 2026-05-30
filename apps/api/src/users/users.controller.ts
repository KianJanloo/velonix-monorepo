import { Controller, Get, Patch, Body, Param, UseGuards, Request, Version } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { UpdateProfileSchema, type UpdateProfileDto } from "@velonix/game-engine";

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Get current authenticated user" })
  getMe(@Request() req: { user: { id: string } }) {
    return this.usersService.findById(req.user.id);
  }

  @Patch("me")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Update current user profile" })
  updateMe(
    @Request() req: { user: { id: string } },
    @Body(new ZodValidationPipe(UpdateProfileSchema)) dto: UpdateProfileDto
  ) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Get(":username")
  @Version("1")
  @ApiOperation({ summary: "Get public creator profile" })
  getPublicProfile(@Param("username") username: string) {
    return this.usersService.getPublicProfile(username);
  }
}
