import { Body, Controller, Get, Post, UseGuards, Version } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { AiService } from "./ai.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";

@ApiTags("ai")
@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get("status")
  @Version("1")
  @ApiOperation({ summary: "Whether AI features are configured on this server" })
  status() {
    return { enabled: this.aiService.enabled };
  }

  @Get("config")
  @Version("1")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Get AI configuration details (admin)" })
  getConfig() {
    return this.aiService.getConfig();
  }

  @Post("balance")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: "AI balance analysis for a game design summary" })
  balance(@Body() body: { gameSummary: string }) {
    return this.aiService.balanceGame(body?.gameSummary ?? "");
  }
}
