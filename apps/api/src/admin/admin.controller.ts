import {
  Controller, Get, Patch, Delete, Param, Query, Body,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty, ApiBody, ApiParam } from "@nestjs/swagger";
import { IsIn, IsString, IsBoolean, MaxLength } from "class-validator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";
import { AdminService } from "./admin.service";
import type { UserRole, GameStatus, SubscriptionTier } from "@velonix/types";

// ── Swagger DTO shapes ────────────────────────────────────────────────────────

class UpdateRoleBodyDto {
  // class-validator decorators are required — the global ValidationPipe runs
  // with whitelist:true and strips any property without a validation decorator.
  @ApiProperty({ enum: ["user", "creator", "admin"], example: "creator", description: "New role for the user" })
  @IsIn(["user", "creator", "admin"])
  role!: UserRole;
}

class RejectGameBodyDto {
  @ApiProperty({ example: "Contains copyrighted artwork.", description: "Reason shown to the creator" })
  @IsString()
  @MaxLength(500)
  reason!: string;
}

class SetPublishedBodyDto {
  @ApiProperty({ example: false, description: "Whether the asset is publicly listed" })
  @IsBoolean()
  isPublished!: boolean;
}

@ApiTags("admin")
@Controller({ path: "admin", version: "1" })
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth("JWT")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Stats ─────────────────────────────────────────────────────────────────

  @Get("stats")
  @ApiOperation({ summary: "Site-wide statistics" })
  getStats() {
    return this.adminService.getStats();
  }

  // ── Users ─────────────────────────────────────────────────────────────────

  @Get("users")
  @ApiOperation({ summary: "List all users" })
  listUsers(
    @Query("page") page?: string,
    @Query("perPage") perPage?: string,
    @Query("search") search?: string,
  ) {
    return this.adminService.listUsers(
      page ? parseInt(page, 10) : 1,
      perPage ? parseInt(perPage, 10) : 20,
      search,
    );
  }

  @Get("users/:id")
  @ApiOperation({ summary: "Get user details" })
  getUser(@Param("id") id: string) {
    return this.adminService.getUser(id);
  }

  @Patch("users/:id/role")
  @ApiOperation({ summary: "Change user role" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiBody({ type: UpdateRoleBodyDto })
  updateRole(@Param("id") id: string, @Body() body: UpdateRoleBodyDto) {
    return this.adminService.updateUserRole(id, body.role);
  }

  @Delete("users/:id")
  @ApiOperation({ summary: "Delete user" })
  deleteUser(@Param("id") id: string) {
    return this.adminService.deleteUser(id);
  }

  // ── Games ─────────────────────────────────────────────────────────────────

  @Get("games")
  @ApiOperation({ summary: "List all games" })
  listGames(
    @Query("page") page?: string,
    @Query("perPage") perPage?: string,
    @Query("status") status?: GameStatus,
    @Query("search") search?: string,
  ) {
    return this.adminService.listGames(
      page ? parseInt(page, 10) : 1,
      perPage ? parseInt(perPage, 10) : 20,
      status,
      search,
    );
  }

  @Patch("games/:id/approve")
  @ApiOperation({ summary: "Approve game for marketplace" })
  approveGame(@Param("id") id: string) {
    return this.adminService.approveGame(id);
  }

  @Patch("games/:id/reject")
  @ApiOperation({ summary: "Reject game submission" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiBody({ type: RejectGameBodyDto })
  rejectGame(@Param("id") id: string, @Body() body: RejectGameBodyDto) {
    return this.adminService.rejectGame(id, body.reason);
  }

  @Delete("games/:id")
  @ApiOperation({ summary: "Admin delete game" })
  deleteGame(@Param("id") id: string) {
    return this.adminService.deleteGame(id);
  }

  // ── Payments ──────────────────────────────────────────────────────────────

  @Get("payments/stats")
  @ApiOperation({ summary: "Revenue totals across game + asset sales" })
  getPaymentStats() {
    return this.adminService.getPaymentStats();
  }

  @Get("payments/transactions")
  @ApiOperation({ summary: "Unified, paginated transaction feed" })
  listTransactions(
    @Query("page") page?: string,
    @Query("perPage") perPage?: string,
    @Query("type") type?: "game" | "asset",
  ) {
    return this.adminService.listTransactions(
      page ? parseInt(page, 10) : 1,
      perPage ? parseInt(perPage, 10) : 20,
      type === "game" || type === "asset" ? type : undefined,
    );
  }

  // ── Subscriptions ───────────────────────────────────────────────────────────

  @Get("subscriptions/stats")
  @ApiOperation({ summary: "Subscriber counts per tier" })
  getSubscriptionStats() {
    return this.adminService.getSubscriptionStats();
  }

  @Get("subscriptions")
  @ApiOperation({ summary: "List paid subscribers" })
  listSubscribers(
    @Query("page") page?: string,
    @Query("perPage") perPage?: string,
    @Query("tier") tier?: SubscriptionTier,
  ) {
    const valid = tier && ["free", "creator", "pro", "studio"].includes(tier) ? tier : undefined;
    return this.adminService.listSubscribers(
      page ? parseInt(page, 10) : 1,
      perPage ? parseInt(perPage, 10) : 20,
      valid,
    );
  }

  // ── Marketplace assets ────────────────────────────────────────────────────────

  @Get("assets")
  @ApiOperation({ summary: "List marketplace component assets" })
  listAssets(
    @Query("page") page?: string,
    @Query("perPage") perPage?: string,
    @Query("search") search?: string,
  ) {
    return this.adminService.listAssets(
      page ? parseInt(page, 10) : 1,
      perPage ? parseInt(perPage, 10) : 20,
      search,
    );
  }

  @Patch("assets/:id/publish")
  @ApiOperation({ summary: "Publish / unpublish an asset" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiBody({ type: SetPublishedBodyDto })
  setAssetPublished(@Param("id") id: string, @Body() body: SetPublishedBodyDto) {
    return this.adminService.setAssetPublished(id, body.isPublished);
  }

  @Delete("assets/:id")
  @ApiOperation({ summary: "Delete a marketplace asset" })
  deleteAsset(@Param("id") id: string) {
    return this.adminService.deleteAsset(id);
  }
}
