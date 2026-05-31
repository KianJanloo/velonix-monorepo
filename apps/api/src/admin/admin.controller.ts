import {
  Controller, Get, Patch, Delete, Param, Query, Body,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty, ApiBody, ApiParam } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";
import { AdminService } from "./admin.service";
import type { UserRole, GameStatus } from "@velonix/types";

// ── Swagger DTO shapes ────────────────────────────────────────────────────────

class UpdateRoleBodyDto {
  @ApiProperty({ enum: ["user", "creator", "admin"], example: "creator", description: "New role for the user" })
  role!: UserRole;
}

class RejectGameBodyDto {
  @ApiProperty({ example: "Contains copyrighted artwork.", description: "Reason shown to the creator" })
  reason!: string;
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
}
