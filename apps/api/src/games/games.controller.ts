import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, Request, Version, HttpCode, HttpStatus
} from "@nestjs/common";
import {
  ApiTags, ApiBearerAuth, ApiOperation,
  ApiParam, ApiBody, ApiResponse, ApiProperty,
} from "@nestjs/swagger";
import { GamesService } from "./games.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { CreateGameSchema, UpdateGameSchema, type CreateGameDto, type UpdateGameDto } from "@velonix/game-engine";

// ── Swagger DTO shapes ────────────────────────────────────────────────────────

class CreateGameBodyDto {
  @ApiProperty({ example: "My Board Game" })
  title!: string;

  @ApiProperty({ required: false, example: "An exciting strategy game." })
  description?: string;

  @ApiProperty({ required: false, enum: ["strategy", "puzzle", "trivia", "party", "rpg", "cooperative", "other"] })
  category?: string;
}

class UpdateGameBodyDto {
  @ApiProperty({ required: false }) title?: string;
  @ApiProperty({ required: false }) description?: string;
  @ApiProperty({ required: false }) category?: string;
  @ApiProperty({ required: false, nullable: true, description: "Price in USD cents; null = free" }) priceUsd?: number | null;
  @ApiProperty({ required: false, description: "Full studio JSON snapshot" }) studioData?: unknown;
}

class GameDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() status!: string;
  @ApiProperty({ nullable: true }) priceUsd!: number | null;
  @ApiProperty() isFree!: boolean;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

// ── Controller ────────────────────────────────────────────────────────────────

@ApiTags("games")
@Controller("games")
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post()
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Create a new game project" })
  @ApiBody({ type: CreateGameBodyDto })
  @ApiResponse({ status: 201, description: "Game created", type: GameDto })
  @ApiResponse({ status: 401, description: "Unauthorized" })
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
  @ApiResponse({ status: 200, description: "User's game projects", type: [GameDto] })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  findMine(@Request() req: { user: { id: string } }) {
    return this.gamesService.findMine(req.user.id);
  }

  @Get(":id")
  @Version("1")
  @ApiOperation({ summary: "Get a single game by ID" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiResponse({ status: 200, description: "Game detail", type: GameDto })
  @ApiResponse({ status: 404, description: "Game not found" })
  findOne(@Param("id") id: string) {
    return this.gamesService.findOne(id);
  }

  @Patch(":id")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Update a game (title, description, pricing, studio data)" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiBody({ type: UpdateGameBodyDto })
  @ApiResponse({ status: 200, description: "Updated game", type: GameDto })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden — not the game owner" })
  @ApiResponse({ status: 404, description: "Game not found" })
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
  @ApiParam({ name: "id", format: "uuid" })
  @ApiResponse({ status: 200, description: "Game submitted for review" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden — not the game owner" })
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
  @ApiParam({ name: "id", format: "uuid" })
  @ApiResponse({ status: 204, description: "Game deleted" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden — not the game owner" })
  remove(
    @Param("id") id: string,
    @Request() req: { user: { id: string } }
  ) {
    return this.gamesService.remove(id, req.user.id);
  }
}
