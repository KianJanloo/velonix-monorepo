import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  Version,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from "@nestjs/swagger";
import { FollowsService } from "../services/follows.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

@ApiTags("users")
@Controller("users")
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post(":username/follow")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Follow a creator" })
  @ApiParam({ name: "username", example: "alice" })
  follow(
    @Param("username") username: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.followsService.follow(req.user.id, username);
  }

  @Delete(":username/follow")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Unfollow a creator" })
  @ApiParam({ name: "username", example: "alice" })
  unfollow(
    @Param("username") username: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.followsService.unfollow(req.user.id, username);
  }

  @Get(":username/follow-status")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({
    summary: "Check whether the current user follows this creator, plus counts",
  })
  @ApiParam({ name: "username", example: "alice" })
  status(
    @Param("username") username: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.followsService.getStatus(req.user.id, username);
  }

  @Get(":username/followers")
  @Version("1")
  @ApiOperation({ summary: "List a creator's followers" })
  @ApiParam({ name: "username", example: "alice" })
  followers(@Param("username") username: string, @Query("page") page?: string) {
    return this.followsService.listFollowers(
      username,
      page ? parseInt(page, 10) : 1,
    );
  }

  @Get(":username/following")
  @Version("1")
  @ApiOperation({ summary: "List the creators a user follows" })
  @ApiParam({ name: "username", example: "alice" })
  following(@Param("username") username: string, @Query("page") page?: string) {
    return this.followsService.listFollowing(
      username,
      page ? parseInt(page, 10) : 1,
    );
  }
}
