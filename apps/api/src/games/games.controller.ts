import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, Request, Version, HttpCode, HttpStatus
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { GamesService } from "./games.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { CreateGameSchema, UpdateGameSchema, type CreateGameDto, type UpdateGameDto } from "@velonix/game-engine";

@ApiTags("games")
@Controller("games")
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post()
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Create a new game project" })
  create(
    @Request() req: { user: { id: string } },
    @Body(new ZodValidationPipe(CreateGameSchema)) dto: CreateGameDto
  ) {
    return this.gamesService.create(req.user.id, dto);
  }

  @Get("mine")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Get all games owned by the current user" })
  findMine(@Request() req: { user: { id: string } }) {
    return this.gamesService.findMine(req.user.id);
  }

  @Get(":id")
  @Version("1")
  @ApiOperation({ summary: "Get a single game by ID" })
  findOne(@Param("id") id: string) {
    return this.gamesService.findOne(id);
  }

  @Patch(":id")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Update a game (title, description, pricing, studio data)" })
  update(
    @Param("id") id: string,
    @Request() req: { user: { id: string } },
    @Body(new ZodValidationPipe(UpdateGameSchema)) dto: UpdateGameDto
  ) {
    return this.gamesService.update(id, req.user.id, dto);
  }

  @Post(":id/publish")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Submit a game for marketplace review" })
  publish(
    @Param("id") id: string,
    @Request() req: { user: { id: string } }
  ) {
    return this.gamesService.publish(id, req.user.id);
  }

  @Delete(":id")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a game project" })
  remove(
    @Param("id") id: string,
    @Request() req: { user: { id: string } }
  ) {
    return this.gamesService.remove(id, req.user.id);
  }
}
