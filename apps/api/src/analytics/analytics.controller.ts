import { Controller, Get, UseGuards, Request, Version } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get("creator")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Creator sales analytics: revenue/sales over time, top items, regional breakdown" })
  creatorOverview(@Request() req: { user: { id: string } }) {
    return this.analytics.creatorOverview(req.user.id);
  }
}
