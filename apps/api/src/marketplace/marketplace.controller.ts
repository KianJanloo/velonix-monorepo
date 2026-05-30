import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, Request, Version
} from "@nestjs/common";
import {
  ApiTags, ApiBearerAuth, ApiOperation,
  ApiQuery, ApiParam, ApiBody, ApiResponse, ApiProperty,
} from "@nestjs/swagger";
import { MarketplaceService } from "./marketplace.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import {
  MarketplaceFiltersSchema, CreateReviewSchema,
  type MarketplaceFiltersDto, type CreateReviewDto
} from "@velonix/game-engine";

// ── Swagger DTO shapes ────────────────────────────────────────────────────────

class CreateReviewBodyDto {
  @ApiProperty({ format: "uuid" })
  gameId!: string;

  @ApiProperty({ minimum: 1, maximum: 5, example: 4 })
  rating!: number;

  @ApiProperty({ required: false, maxLength: 120, example: "Great game!" })
  title?: string;

  @ApiProperty({ required: false, maxLength: 2000 })
  body?: string;
}

class GameSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() status!: string;
  @ApiProperty({ nullable: true }) priceUsd!: number | null;
  @ApiProperty() isFree!: boolean;
  @ApiProperty({ nullable: true }) averageRating!: number | null;
  @ApiProperty() totalPurchases!: number;
}

class MarketplacePageDto {
  @ApiProperty({ type: [GameSummaryDto] }) data!: GameSummaryDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() perPage!: number;
  @ApiProperty() totalPages!: number;
  @ApiProperty() hasNextPage!: boolean;
  @ApiProperty() hasPreviousPage!: boolean;
}

// ── Controller ────────────────────────────────────────────────────────────────

@ApiTags("marketplace")
@Controller("marketplace")
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get()
  @Version("1")
  @ApiOperation({ summary: "Browse marketplace listings with filters" })
  @ApiQuery({ name: "sort", required: false, enum: ["newest", "popular", "top_rated", "price_asc", "price_desc", "most_sold"], example: "newest" })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "perPage", required: false, type: Number, example: 24 })
  @ApiQuery({ name: "category", required: false, type: String })
  @ApiQuery({ name: "isFree", required: false, type: Boolean })
  @ApiQuery({ name: "priceMin", required: false, type: Number })
  @ApiQuery({ name: "priceMax", required: false, type: Number })
  @ApiQuery({ name: "complexity", required: false, type: String })
  @ApiQuery({ name: "minRating", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiResponse({ status: 200, description: "Paginated listing results", type: MarketplacePageDto })
  @ApiResponse({ status: 400, description: "Invalid filter parameters" })
  findListings(@Query(new ZodValidationPipe(MarketplaceFiltersSchema, true)) filters: MarketplaceFiltersDto) {
    return this.marketplaceService.findListings(filters);
  }

  @Get("featured")
  @Version("1")
  @ApiOperation({ summary: "Get featured/top-selling games" })
  @ApiResponse({ status: 200, description: "Up to 6 featured games", type: [GameSummaryDto] })
  featured() {
    return this.marketplaceService.findFeatured();
  }

  @Get("library")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Get games owned by the current user" })
  @ApiResponse({ status: 200, description: "User's purchased games", type: [GameSummaryDto] })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  library(@Request() req: { user: { id: string } }) {
    return this.marketplaceService.getLibrary(req.user.id);
  }

  @Get(":gameId/reviews")
  @Version("1")
  @ApiOperation({ summary: "Get reviews for a game" })
  @ApiParam({ name: "gameId", format: "uuid" })
  @ApiResponse({ status: 200, description: "List of reviews (max 50)" })
  getReviews(@Param("gameId") gameId: string) {
    return this.marketplaceService.getReviews(gameId);
  }

  @Post("reviews")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Submit a review for a purchased game" })
  @ApiBody({ type: CreateReviewBodyDto })
  @ApiResponse({ status: 201, description: "Review created" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 409, description: "Already reviewed this game" })
  createReview(
    @Request() req: { user: { id: string } },
    @Body(new ZodValidationPipe(CreateReviewSchema)) dto: CreateReviewDto
  ) {
    return this.marketplaceService.createReview(req.user.id, dto);
  }
}
