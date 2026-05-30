import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, Request, Version
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { MarketplaceService } from "./marketplace.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import {
  MarketplaceFiltersSchema, CreateReviewSchema,
  type MarketplaceFiltersDto, type CreateReviewDto
} from "@velonix/game-engine";

@ApiTags("marketplace")
@Controller("marketplace")
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get()
  @Version("1")
  @ApiOperation({ summary: "Browse marketplace listings with filters" })
  findListings(@Query(new ZodValidationPipe(MarketplaceFiltersSchema)) filters: MarketplaceFiltersDto) {
    return this.marketplaceService.findListings(filters);
  }

  @Get("featured")
  @Version("1")
  @ApiOperation({ summary: "Get featured/top-selling games" })
  featured() {
    return this.marketplaceService.findFeatured();
  }

  @Get("library")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Get games owned by the current user" })
  library(@Request() req: { user: { id: string } }) {
    return this.marketplaceService.getLibrary(req.user.id);
  }

  @Get(":gameId/reviews")
  @Version("1")
  @ApiOperation({ summary: "Get reviews for a game" })
  getReviews(@Param("gameId") gameId: string) {
    return this.marketplaceService.getReviews(gameId);
  }

  @Post("reviews")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Submit a review for a purchased game" })
  createReview(
    @Request() req: { user: { id: string } },
    @Body(new ZodValidationPipe(CreateReviewSchema)) dto: CreateReviewDto
  ) {
    return this.marketplaceService.createReview(req.user.id, dto);
  }
}
